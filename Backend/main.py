from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


import numpy as np
import joblib
import requests
import tensorflow as tf
import pandas as pd
import logging
import feedparser

from mongo_db import users_collection
from mongo_db import predictions_collection
from datetime import datetime

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from pydantic import BaseModel

# ---------------- CONFIG ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
analyzer = SentimentIntensityAnalyzer()

# ✅ CREATE APP FIRST (IMPORTANT FIX)
app = FastAPI(title="Crypto Hybrid Predictor 🚀")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- LOAD MODELS ----------------
lstm_model = tf.keras.models.load_model("model.keras")
scaler_X = joblib.load("scaler_X.pkl")
scaler_y = joblib.load("scaler_y.pkl")

lr_model = joblib.load("lr_model.pkl")
lr_scaler = joblib.load("lr_scaler.pkl")

# ---------------- REQUEST MODELS ----------------
class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# ---------------- DB ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- AUTH ----------------
@app.post("/signup")
def signup(user: UserSignup):
    existing = users_collection.find_one({"email": user.email})

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    users_collection.insert_one({
        "username": user.username,
        "email": user.email,
        "password": user.password
    })

    return {"message": "Signup successful"}

@app.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})

    if not db_user or db_user["password"] != user.password:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return {"message": "Login successful"}

# ---------------- CRYPTO ----------------
crypto_symbols = {
    "bitcoin": "BTCUSDT",
    "ethereum": "ETHUSDT",
    "litecoin": "LTCUSDT"
}

# ---------------- LIVE PRICE ----------------
def get_live_price(symbol):
    try:
        url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}"
        return float(requests.get(url).json()["price"])
    except:
        return None

# ---------------- DATA PREP ----------------
def prepare_dataframe(symbol):
    try:
        url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval=1d&limit=300"
        data = requests.get(url).json()

        df = pd.DataFrame(data, columns=[
            "time","open","high","low","close","volume",
            "close_time","qav","trades","tbbav","tbqav","ignore"
        ])

        df["close"] = df["close"].astype(float)
        df["volume"] = df["volume"].astype(float)

        df['lag_1'] = df['close'].shift(1)
        df['lag_2'] = df['close'].shift(2)

        df['returns'] = df['close'].pct_change()
        df['vol_change'] = df['volume'].pct_change()

        df['SMA_10'] = df['close'].rolling(10).mean()
        df['EMA_10'] = df['close'].ewm(span=10).mean()
        df['volatility'] = df['close'].rolling(10).std()

        delta = df['close'].diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)

        avg_gain = gain.rolling(14).mean()
        avg_loss = loss.rolling(14).mean().replace(0, 1e-9)

        rs = avg_gain / avg_loss
        df['RSI'] = 100 - (100 / (1 + rs))

        ema12 = df['close'].ewm(span=12).mean()
        ema26 = df['close'].ewm(span=26).mean()
        df['MACD'] = ema12 - ema26

        # LSTM extra features
        df['hour'] = 0
        df['BB_upper'] = df['close'].rolling(20).mean() + 2*df['close'].rolling(20).std()
        df['BB_lower'] = df['close'].rolling(20).mean() - 2*df['close'].rolling(20).std()

        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        df.dropna(inplace=True)

        return df

    except Exception as e:
        logger.error(f"Data error: {e}")
        return None

# ---------------- LSTM ----------------
def predict_lstm(df):
    try:
        features = [
            'close','volume','SMA_10','EMA_10','RSI',
            'volatility','lag_1','lag_2','hour',
            'returns','vol_change','MACD','BB_upper','BB_lower'
        ]

        data = df[features].tail(60).values

        scaled = scaler_X.transform(data)
        scaled = scaled.reshape(1, 60, scaled.shape[1])

        pred = lstm_model.predict(scaled, verbose=0)

        change = scaler_y.inverse_transform([[pred[0][0]]])[0][0]

        last_close = df['close'].iloc[-1]

        return last_close * (1 + change)

    except Exception as e:
        logger.error(f"LSTM error: {e}")
        return None

# ---------------- LR ----------------
def predict_lr(df):
    try:
        features = [
            'close','volume','lag_1','lag_2',
            'returns','vol_change',
            'SMA_10','EMA_10',
            'volatility','RSI','MACD'
        ]

        latest = df[features].iloc[-1:].values
        scaled = lr_scaler.transform(latest)

        return float(lr_model.predict(scaled)[0])

    except Exception as e:
        logger.error(f"LR error: {e}")
        return None

# ---------------- HYBRID ----------------
def predict_hybrid(df):
    lstm = predict_lstm(df)
    lr = predict_lr(df)

    if lstm and lr:
        return (0.6 * lstm) + (0.4 * lr), lstm, lr
    elif lstm:
        return lstm, lstm, None
    elif lr:
        return lr, None, lr
    else:
        return None, None, None

# ---------------- SIGNAL ----------------
def generate_signal(predicted, current):
    if not predicted or not current:
        return "NO DATA"

    diff = (predicted - current) / current * 100

    if diff > 3:
        return "STRONG BUY"
    elif diff > 1:
        return "BUY"
    elif diff < -3:
        return "STRONG SELL"
    elif diff < -1:
        return "SELL"
    else:
        return "HOLD"

# ---------------- SENTIMENT ----------------
def get_sentiment():
    try:
        feed = feedparser.parse("https://cointelegraph.com/rss")

        scores = []
        for entry in feed.entries[:10]:
            scores.append(analyzer.polarity_scores(entry.title)['compound'])

        score = sum(scores)/len(scores) if scores else 0

        if score > 0.2:
            return "POSITIVE 📈"
        elif score < -0.2:
            return "NEGATIVE 📉"
        else:
            return "NEUTRAL ⚖️"

    except:
        return "UNKNOWN"

# ---------------- API ----------------
@app.get("/predict")
def predict(crypto: str = "bitcoin"):
    symbol = crypto_symbols.get(crypto.lower(), "BTCUSDT")

    live_price = get_live_price(symbol)
    df = prepare_dataframe(symbol)

    if df is None:
        raise HTTPException(status_code=500, detail="Data failed")

    predicted, lstm_price, lr_price = predict_hybrid(df)

    if predicted is None:
        raise HTTPException(status_code=500, detail="Prediction failed")

    signal = generate_signal(predicted, live_price)
    sentiment = get_sentiment()

    # 🔥 SAVE TO MONGODB
    predictions_collection.insert_one({
        "crypto": crypto,
        "live_price": live_price,
        "predicted_price": predicted,
        "lstm_price": lstm_price,
        "lr_price": lr_price,
        "signal": signal,
        "sentiment": sentiment,
        "timestamp": datetime.utcnow()
    })

    return {
        "crypto": crypto,
        "live_price": live_price,
        "lstm_price": lstm_price,
        "lr_price": lr_price,
        "predicted_price": predicted,
        "signal": signal,
        "sentiment": sentiment
    }


# ---------------- HISTORY ----------------

@app.get("/history")
def get_history():
    data = list(predictions_collection.find().sort("timestamp", -1).limit(20))

    for item in data:
        item["_id"] = str(item["_id"])

    return {"history": data}

# ---------------- NEWS ----------------
@app.get("/news")
def get_news():
    try:
        feed = feedparser.parse("https://cointelegraph.com/rss")

        news_list = []
        for entry in feed.entries[:10]:
            news_list.append({
                "title": entry.title,
                "link": entry.link
            })

        return {"news": news_list}

    except:
        return {"news": []}

# ---------------- ROOT ----------------
@app.get("/")
def home():
    return {"message": "Hybrid Backend Running 🚀"}