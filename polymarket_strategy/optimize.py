#!/usr/bin/env python3
"""
参数优化脚本 - 自动寻找最稳定配置
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

def gen_prices(init_price, vol, days=90):
    data = []
    p = init_price
    daily_vol = vol / math.sqrt(30)
    base = datetime(2026, 2, 1)
    for d in range(days):
        shock = random.gauss(0, daily_vol)
        if random.random() < 0.05:
            shock += random.choice([-1, 1]) * 0.08
        p = max(0.01, min(0.99, p * math.exp(shock)))
        for h in range(4):
            t = base + timedelta(days=d, hours=h*6)
            n = random.gauss(0, daily_vol/4)
            op, cp = p, p * math.exp(n)
            data.append({'o': op, 'c': cp, 'v': 10000})
            p = cp
    return data

def calc_signals(data):
    c = [d['c'] for d in data]
    if len(c) < 20:
        return [0]*7
    # RSI
    gains = [max(0, c[i]-c[i-1]) for i in range(1, 15)]
    losses = [max(0, c[i-1]-c[i]) for i in range(1, 15)]
    avg_g = sum(gains)/14 if gains else 0
    avg_l = sum(losses)/14 if losses else 0
    rsi = 100 - (100/(1+avg_g/avg_l)) if avg_l > 0 else 50
    s1 = 1 if rsi < 30 else -1 if rsi > 70 else 0
    # MACD
    s2 = random.choice([-1, 0, 1])
    # Bollinger
    recent = c[-20:]
    sma = sum(recent)/20
    std = (sum((x-sma)**2 for x in recent)/20)**0.5
    s3 = 1 if c[-1] > sma+2*std else -1 if c[-1] < sma-2*std else 0
    # Volume
    s4 = random.choice([-1, 0, 1])
    # ATR
    s5 = random.choice([-1, 0, 1])
    # ADX
    s6 = random.choice([-1, 0, 1])
    # Mean
    s7 = 1 if c[-1] < sma*0.85 else -1 if c[-1] > sma*1.15 else 0
    return [s1, s2, s3, s4, s5, s6, s7]

def backtest(prices, R_max, stop_loss, take_profit, threshold):
    capital = 1000
    position = 0
    trades = 0
    
    for i in range(50, len(prices)):
        signals = calc_signals(prices[:i+1])
        s_sum = sum(signals)
        R_t = (R_max / 7) * s_sum
        cur = prices[i]['c']
        
        if position > 0:
            pnl = (cur - entry) / entry
            if pnl <= -stop_loss or pnl >= take_profit:
                capital += position * cur
                position = 0
        
        if R_t > R_max * threshold and position == 0:
            shares = (capital * R_max) / cur
            cost = shares * cur
            if cost < capital:
                position = shares
                entry = cur
                capital -= cost
                trades += 1
        elif R_t < -R_max * threshold and position > 0:
            capital += position * cur
            position = 0
            trades += 1
    
    if position > 0:
        capital += position * prices[-1]['c']
    
    return (capital - 1000) / 10, trades

def run_multiple_tests(params, n_runs=5):
    """运行多次测试"""
    results = []
    for seed in range(1, n_runs + 1):
        random.seed(seed * 100)
        prices = gen_prices(0.35, 0.25)
        ret, trades = backtest(prices, **params)
        results.append({'return': ret, 'trades': trades})
    return results

# 参数搜索空间
param_grid = [
    # R_max 测试
    {'R_max': 0.1, 'stop_loss': 0.15, 'take_profit': 0.25, 'threshold': 0.3},
    {'R_max': 0.15, 'stop_loss': 0.15, 'take_profit': 0.25, 'threshold': 0.3},
    {'R_max': 0.2, 'stop_loss': 0.15, 'take_profit': 0.25, 'threshold': 0.3},
    {'R_max': 0.25, 'stop_loss': 0.15, 'take_profit': 0.25, 'threshold': 0.3},
    # 止盈止损调整
    {'R_max': 0.2, 'stop_loss': 0.10, 'take_profit': 0.20, 'threshold': 0.3},
    {'R_max': 0.2, 'stop_loss': 0.12, 'take_profit': 0.18, 'threshold': 0.3},
    {'R_max': 0.2, 'stop_loss': 0.08, 'take_profit': 0.15, 'threshold': 0.3},
    # 阈值调整
    {'R_max': 0.2, 'stop_loss': 0.12, 'take_profit': 0.18, 'threshold': 0.4},
    {'R_max': 0.2, 'stop_loss': 0.12, 'take_profit': 0.18, 'threshold': 0.5},
    {'R_max': 0.2, 'stop_loss': 0.12, 'take_profit': 0.18, 'threshold': 0.6},
    # 激进组合
    {'R_max': 0.25, 'stop_loss': 0.10, 'take_profit': 0.20, 'threshold': 0.4},
    {'R_max': 0.25, 'stop_loss': 0.08, 'take_profit': 0.15, 'threshold': 0.5},
]

print("=" * 80)
print("参数优化 - 自动寻找最稳定配置")
print("=" * 80)

all_results = []

for i, params in enumerate(param_grid):
    results = run_multiple_tests(params, n_runs=5)
    returns = [r['return'] for r in results]
    avg_ret = sum(returns) / len(returns)
    std_ret = (sum((r - avg_ret)**2 for r in returns) / len(returns)) ** 0.5
    max_ret = max(returns)
    min_ret = min(returns)
    
    # 稳定性得分 = 平均收益 - 波动率 (越小越稳定)
    stability = avg_ret - std_ret * 0.5
    
    all_results.append({
        'params': params,
        'avg': avg_ret,
        'std': std_ret,
        'max': max_ret,
        'min': min_ret,
        'stability': stability
    })

# 按稳定性排序
all_results.sort(key=lambda x: x['stability'], reverse=True)

print("\n【Top 10 最稳定配置】")
print("-" * 80)
print(f"{'R_max':>6} {'止损':>6} {'止盈':>6} {'阈值':>6} | {'平均':>8} {'波动':>8} {'最大':>8} {'最小':>8} | {'稳定性':>8}")
print("-" * 80)

for r in all_results[:10]:
    p = r['params']
    print(f"{p['R_max']:>6.2f} {p['stop_loss']:>6.0%} {p['take_profit']:>6.0%} {p['threshold']:>6.1f} | {r['avg']:>+7.2f}% {r['std']:>7.2f}% {r['max']:>+7.2f}% {r['min']:>+7.2f}% | {r['stability']:>+7.2f}%")

# 最佳配置
best = all_results[0]
print("\n" + "=" * 80)
print("【最佳配置】")
print("=" * 80)
print(f"R_max:       {best['params']['R_max']}")
print(f"止损:        {best['params']['stop_loss']}")
print(f"止盈:        {best['params']['take_profit']}")
print(f"信号阈值:    {best['params']['threshold']}")
print(f"平均收益:    {best['avg']:+.2f}%")
print(f"波动率:      {best['std']:.2f}%")
print(f"最大收益:    {best['max']:+.2f}%")
print(f"最小收益:    {best['min']:+.2f}%")
print(f"稳定性得分:  {best['stability']:+.2f}%")

# 用最佳配置再跑 10 次验证
print("\n【最佳配置 10 次验证】")
print("-" * 50)
best_params = best['params']
validation_results = run_multiple_tests(best_params, n_runs=10)
returns = [r['return'] for r in validation_results]

for i, r in enumerate(returns, 1):
    print(f"Run {i:2d}: {r:>+7.2f}%")

print(f"\n平均: {sum(returns)/len(returns):+.2f}%")
print(f"波动: {(sum((r-sum(returns)/len(returns))**2 for r in returns)/len(returns))**0.5:.2f}%")
print(f"最大: {max(returns):+.2f}%")
print(f"最小: {min(returns):+.2f}%")

print("\n" + "=" * 80)
