#!/usr/bin/env python3
"""
快速参数优化 - 100次测试
"""

import random
import math
from datetime import datetime

def gen_prices(init_price, vol, days=90):
    data = []
    p = init_price
    daily_vol = vol / math.sqrt(30)
    for d in range(days):
        shock = random.gauss(0, daily_vol)
        if random.random() < 0.05:
            shock += random.choice([-1, 1]) * 0.08
        p = max(0.01, min(0.99, p * math.exp(shock)))
        for h in range(4):
            n = random.gauss(0, daily_vol/4)
            data.append({'c': p * math.exp(n)})
            p = data[-1]['c']
    return data

def calc_signals(data):
    c = [d['c'] for d in data]
    if len(c) < 20:
        return [0]*7
    gains = [max(0, c[i]-c[i-1]) for i in range(1, 15)]
    losses = [max(0, c[i-1]-c[i]) for i in range(1, 15)]
    avg_g = sum(gains)/14 if gains else 0
    avg_l = sum(losses)/14 if losses else 0
    rsi = 100 - (100/(1+avg_g/avg_l)) if avg_l > 0 else 50
    s1 = 1 if rsi < 30 else -1 if rsi > 70 else 0
    s2 = random.choice([-1, 0, 1])
    recent = c[-20:]
    sma = sum(recent)/20
    std = (sum((x-sma)**2 for x in recent)/20)**0.5
    s3 = 1 if c[-1] > sma+2*std else -1 if c[-1] < sma-2*std else 0
    s4 = random.choice([-1, 0, 1])
    s5 = random.choice([-1, 0, 1])
    s6 = random.choice([-1, 0, 1])
    s7 = 1 if c[-1] < sma*0.85 else -1 if c[-1] > sma*1.15 else 0
    return [s1, s2, s3, s4, s5, s6, s7]

def backtest(prices, R_max, stop_loss, take_profit, threshold):
    capital = 1000
    position = 0
    for i in range(50, len(prices)):
        signals = calc_signals(prices[:i+1])
        R_t = (R_max / 7) * sum(signals)
        cur = prices[i]['c']
        
        if position > 0:
            pnl = (cur - entry) / entry
            if pnl <= -stop_loss or pnl >= take_profit:
                capital += position * cur
                position = 0
        
        if R_t > R_max * threshold and position == 0:
            shares = (capital * R_max) / cur
            if shares * cur < capital:
                position = shares
                entry = cur
                capital -= shares * cur
        elif R_t < -R_max * threshold and position > 0:
            capital += position * cur
            position = 0
    
    if position > 0:
        capital += position * prices[-1]['c']
    return (capital - 1000) / 10

# 简化参数组合
configs = []
for r_max in [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]:
    for sl in [0.05, 0.08, 0.10, 0.15, 0.20]:
        for tp in [0.10, 0.15, 0.20, 0.25, 0.30]:
            if tp <= sl:
                continue
            for thresh in [0.3, 0.4, 0.5, 0.6]:
                configs.append({'R_max': r_max, 'stop_loss': sl, 'take_profit': tp, 'threshold': thresh})

print(f"测试 {len(configs)} 种配置 × 100 次...")

results = []
for idx, params in enumerate(configs):
    if idx % 100 == 0:
        print(f"进度: {idx}/{len(configs)}")
    
    returns = []
    for seed in range(1, 101):
        random.seed(seed * 100)
        prices = gen_prices(0.35, 0.25)
        ret = backtest(prices, **params)
        returns.append(ret)
    
    avg = sum(returns) / len(returns)
    std = (sum((r - avg)**2 for r in returns) / len(returns)) ** 0.5
    win_rate = len([r for r in returns if r > 0]) / len(returns)
    stability = avg - std * 0.5 + win_rate * 2
    
    results.append({'params': params, 'avg': avg, 'std': std, 'win_rate': win_rate, 'stability': stability})

results.sort(key=lambda x: x['stability'], reverse=True)

print("\n" + "=" * 80)
print("【Top 15 最稳定配置】")
print("-" * 80)
print(f"{'R_max':>5} {'止损':>5} {'止盈':>5} {'阈值':>5} | {'平均':>7} {'波动':>6} {'胜率':>6} | {'稳定性':>7}")
print("-" * 80)

for r in results[:15]:
    p = r['params']
    print(f"{p['R_max']:>5.2f} {p['stop_loss']:>5.0%} {p['take_profit']:>5.0%} {p['threshold']:>5.1f} | {r['avg']:>+6.2f}% {r['std']:>5.2f}% {r['win_rate']:>5.1%} | {r['stability']:>+6.3f}")

best = results[0]
print("\n" + "=" * 80)
print("【最优配置】")
print("=" * 80)
p = best['params']
print(f"R_max:       {p['R_max']}")
print(f"止损:        {p['stop_loss']}")
print(f"止盈:        {p['take_profit']}")
print(f"信号阈值:     {p['threshold']}")
print(f"平均收益:    {best['avg']:+.2f}%")
print(f"波动率:      {best['std']:.2f}%")
print(f"胜率:        {best['win_rate']:.1%}")

# 验证
print("\n【最优配置 100 次验证】")
returns = []
for seed in range(1, 101):
    random.seed(seed * 100)
    prices = gen_prices(0.35, 0.25)
    ret = backtest(prices, **p)
    returns.append(ret)
print(f"平均: {sum(returns)/len(returns):+.2f}%")
print(f"波动: {(sum((r-sum(returns)/len(returns))**2 for r in returns)/len(returns))**0.5:.2f}%")
print(f"最大: {max(returns):+.2f}%")
print(f"最小: {min(returns):+.2f}%")
print(f"胜率: {len([r for r in returns if r > 0])/len(returns):.1%}")
