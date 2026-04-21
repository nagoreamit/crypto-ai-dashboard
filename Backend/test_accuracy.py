import numpy as np

# Example data (replace with your test dataset)
actual_prices = np.array([100, 102, 101, 105, 107])
predicted_prices = np.array([101, 103, 100, 106, 108])

# Direction accuracy
direction_correct = np.sum(
    (actual_prices[1:] - actual_prices[:-1]) *
    (predicted_prices[1:] - predicted_prices[:-1]) > 0
)

direction_accuracy = direction_correct / (len(actual_prices) - 1) * 100

print("Direction Accuracy:", direction_accuracy, "%")