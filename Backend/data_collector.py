import time
import requests
from datetime import datetime
from database import insert_price

def get_live_data():
    url = "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
    res = requests.get(url)
    data = res.json()

    price = float(data["lastPrice"])
    volume = float(data["volume"])

    return price, volume

counter = 0

while True:
    try:
        price, volume = get_live_data()
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        insert_price(current_time, price, volume)

        print(f"Saved: {price}")

        counter += 1

        # retrain every 60 minutes
        if counter % 60 == 0:
            import os
            print("🔄 Retraining model...")
            os.system("python retrain_model.py")

    except Exception as e:
        print("Error:", e)

    time.sleep(60)