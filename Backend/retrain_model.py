import pandas as pd
import numpy as np
import joblib
import tensorflow as tf
from database import fetch_all_data

# load existing model
model = tf.keras.models.load_model("model.keras")

scaler_X = joblib.load("scaler_X.pkl")
scaler_y = joblib.load("scaler_y.pkl")

def retrain():
    data = fetch_all_data()

    if len(data) < 100:
        print("Not enough data yet")
        return

    df = pd.DataFrame(data, columns=["id", "time", "price", "volume"])

    df["price"] = df["price"].astype(float)
    df["volume"] = df["volume"].astype(float)

    # simple features
    df["returns"] = df["price"].pct_change()
    df = df.dropna()

    X = df[["price", "volume", "returns"]].values
    y = df["price"].shift(-1).dropna().values

    X = X[:-1]

    X_scaled = scaler_X.fit_transform(X)
    y_scaled = scaler_y.fit_transform(y.reshape(-1, 1))

    X_scaled = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))

    model.fit(X_scaled, y_scaled, epochs=2, batch_size=8)

    model.save("model.keras")

    print("✅ Model retrained!")

retrain()