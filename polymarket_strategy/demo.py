#!/usr/bin/env python3
"""Simplified Polymarket 7-Signal Strategy Demo"""

import random
from datetime import datetime, timedelta

# Generate mock price data (90 days, daily)
def generate_data(days=90):
    data = []
    price = 0.5
    for i in range(days):
        price = max(0.1, min(0.9, price + random.gauss(0, 0.05)))
        data.append({"day": i, "close": round(price, 4)})
    return data

# Simplified signal functions (mock)
def get_signals(data):
    # Simulate 7 signals with some correlation
    signals = {
        "RSI": random.choice([-1, 0, 1]),
        "MACD": random.choice([-1, 0, 1]),
        "Bollinger": random.choice([-1, 0, 1]),
        "Volume": random.choice([-1, 0, 1]),
        "ATR": random.choice([-1, 0, 1]),
        "ADX": random.choice([-1, 0, 1]),
        "MeanRev": random.choice([-1, 0, 1])
    }
    return signals

# Main backtest
def backtest(data, R_max=0.5):
    capital = 1000
    position = 0
    trades = []
    
    for i in range(20, len(data)):  # Warmup
        signals = get_signals(data[:i+1])
        score = sum(signals.values()) / 7
        signal_strength = (R_max / 7) * sum(signals.values())
        
        price = data[i]["close"]
        
        # Trading logic
        if score > 0.3 and position == 0:  # BUY
            position = (capital * R_max) / price
            capital -= position * price
            trades.append({"day": i, "action": "BUY", "price": price})
        elif score < -0.3 and position > 0:  # SELL
            capital += position * price
            trades.append({"day": i, "action": "SELL", "price": price, "profit": (price - trades[-1]["price"]) * position})
            position = 0
    
    # Close position
    if position > 0:
        capital += position * data[-1]["close"]
        trades.append({"action": "SELL", "price": data[-1]["close"]})
    
    return {
        "initial": 1000,
        "final": capital,
        "return": (capital - 1000) / 10,
        "trades": trades
    }

# Run
print("=" * 50)
print("Polymarket 7-Signal Strategy - Backtest Demo")
print("=" * 50)

data = generate_data(90)
print(f"\nGenerated {len(data)} days of mock data")
print(f"Sample: Day 0={data[0]['close']}, Day 45={data[45]['close']}, Day 89={data[89]['close']}")

print("\nRunning backtest...")
results = backtest(data)

print(f"\nResults:")
print(f"  Initial Capital: $1000")
print(f"  Final Capital:   ${results['final']:.2f}")
print(f"  Total Return:   {results['return']:.1f}%")
print(f"  Total Trades:   {len(results['trades'])}")

print("\nSample Trades:")
for t in results['trades'][:5]:
    print(f"  {t}")

print("\n" + "=" * 50)
print("✅ Simulation complete!")
print("=" * 50)
