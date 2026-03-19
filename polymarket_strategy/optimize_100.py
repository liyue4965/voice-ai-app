#!/usr/bin/env python3
"""
大规模参数优化 - 100次测试
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
            n = random.gauss(0, daily_vol/4)
            op, cp = p, p * math.exp(n)
            data.append({'o': op, 'c': cp, 'v': 10000})
            p = cp
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

def backtest(prices, R_max, stop_loss, take_profit, threshold, min_confidence):
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
        
        # 置信度检查
        align_count = len([s for s in signals if s != 0])
        confidence = abs(R_t) * (align_count / 7)
        
        if R_t > R_max * threshold and position == 0 and confidence > min_confidence:
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

def run_tests(params, n_runs=100):
    results = []
    for seed in range(1, n_runs + 1):
        random.seed(seed * 100)
        prices = gen_prices(0.35, 0.25)
        ret, trades = backtest(prices, **params)
        results.append({'return': ret, 'trades': trades})
    return results

# 扩展参数搜索
param_grid = []

# R_max 从 0.1 到 0.4
for r_max in [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]:
    # 止损 5% - 20%
    for sl in [0.05, 0.08, 0.10, 0.12, 0.15, 0.20]:
        # 止盈 10% - 30%
        for tp in [0.10, 0.15, 0.20, 0.25, 0.30]:
            if tp <= sl:  # 止盈必须大于止损
                continue
            # 阈值 0.3 - 0.7
            for thresh in [0.3, 0.4, 0.5, 0.6, 0.7]:
                # 最小置信度
                for mc in [0.0, 0.02, 0.05]:
                    param_grid.append({
                        'R_max': r_max,
                        'stop_loss': sl,
                        'take_profit': tp,
                        'threshold': thresh,
                        'min_confidence': mc
                    })

print("=" * 90)
print(f"大规模参数优化 - 测试 {len(param_grid)} 种配置 × 100 次")
print("=" * 90)

all_results = []

for idx, params in enumerate(param_grid):
    if idx % 50 == 0:
        print(f"进度: {idx}/{len(param_grid)}...")
    
    results = run_tests(params, n_runs=100)
    returns = [r['return'] for r in results]
    
    avg_ret = sum(returns) / len(returns)
    std_ret = (sum((r - avg_ret)**2 for r in returns) / len(returns)) ** 0.5
    
    # 稳定性得分: 收益 - 波动*权重
    # 偏好: 正收益、低波动、高胜率
    win_rate = len([r for r in returns if r > 0]) / len(returns)
    stability = avg_ret - std_ret * 0.5 + win_rate * 2
    
    all_results.append({
        'params': params,
        'avg': avg_ret,
        'std': std_ret,
        'max': max(returns),
        'min': min(returns),
        'win_rate': win_rate,
        'stability': stability
    })

# 按稳定性排序
all_results.sort(key=lambda x: x['stability'], reverse=True)

print("\n【Top 20 最稳定配置】")
print("-" * 90)
print(f"{'R_max':>5} {'止损':>5} {'止盈':>5} {'阈值':>5} {'置信':>5} | {'平均':>7} {'波动':>6} {'胜率':>6} | {'稳定性':>8}")
print("-" * 90)

for r in all_results[:20]:
    p = r['params']
    print(f"{p['R_max']:>5.2f} {p['stop_loss']:>5.0%} {p['take_profit']:>5.0%} {p['threshold']:>5.1f} {p['min_confidence']:>5.2f} | {r['avg']:>+6.2f}% {r['std']:>5.2f}% {r['win_rate']:>5.1%} | {r['stability']:>+7.3f}")

# 最佳配置
best = all_results[0]
print("\n" + "=" * 90)
print("【最优配置】")
print("=" * 90)
p = best['params']
print(f"R_max:        {p['R_max']}")
print(f"止损:         {p['stop_loss']}")
print(f"止盈:         {p['take_profit']}")
print(f"信号阈值:      {p['threshold']}")
print(f"最小置信度:    {p['min_confidence']}")
print(f"平均收益:     {best['avg']:+.2f}%")
print(f"波动率:       {best['std']:.2f}%")
print(f"胜率:         {best['win_rate']:.1%}")
print(f"最大收益:     {best['max']:+.2f}%")
print(f"最小收益:     {best['min']:+.2f}%")
print(f"稳定性得分:   {best['stability']:+.3f}")

# 用最佳配置再跑 100 次验证
print("\n【最优配置 100 次验证】")
print("-" * 50)
best_params = best['params']
validation_results = run_tests(best_params, n_runs=100)
returns = [r['return'] for r in validation_results]

print(f"平均: {sum(returns)/len(returns):+.2f}%")
print(f"波动: {(sum((r-sum(returns)/len(returns))**2 for r in returns)/len(returns))**0.5:.2f}%")
print(f"最大: {max(returns):+.2f}%")
print(f"最小: {min(returns):+.2f}%")
print(f"胜率: {len([r for r in returns if r > 0])/len(returns):.1%}")

print("\n" + "=" * 90)
