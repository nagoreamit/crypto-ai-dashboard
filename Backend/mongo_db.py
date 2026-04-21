from pymongo import MongoClient

# 🔥 LOCAL (or replace with Atlas URL)
client = MongoClient("mongodb://localhost:27017/")

db = client["crypto_ai"]

# Collections
users_collection = db["users"]
predictions_collection = db["predictions"]