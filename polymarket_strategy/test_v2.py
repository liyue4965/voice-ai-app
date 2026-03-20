#!/usr/bin/env python3
"""
Polymarket 7-Signal Strategy - V2 测试
================================================
简化版，确保能产生交易信号
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json

random.seed(42)

# ==================== CONFIGURATION ====================

class StrategyConfig:
    def __init__(self):
        self.R_max = 0.20
        self.sentiment_weight = 0.3
        self.stop_loss = 0.03
        self.take_profit_1 = 0.05
        self.take_profit_2 = 0.10
        self.take_profit_3 = 0.15
        self.exit_ratio_1 = 0.5
        self.exit_ratio_2 = 0.5
        self.time_decay_enabled = True
        self.time_decay_hours = 24
        self.time_decay_strength = 1.5
        self.min_volume = 50000
        self.max_volume = 2000000


# ==================== MARKET DATA ====================

MARKETS = {
    "bitboy": {"question": "BitBoy convicted?", "current_yes": 0.224, "volume": 122077, "volatility_1m": 0.4, "news_sentiment": -0.3},
    "russia": {"question": "Russia-Ukraine Ceasefire", "current_yes": 0.535, "volume": 1388182, "volatility_1m": 0.15, "news_sentiment": 0.1},
    "fed": {"question": "Fed cuts rates March 2026", "current_yes": 0.35, "volume": 850000, "volatility_1m": 0.25, "news_sentiment": 0.2},
    "low_vol": {"question": "Low Volume Test", "current_yes": 0.50, "volume": 30000, "volatility_1m": 0.6, "news_sentiment": 0.0},
}


def generate_price_series(initial_price: float, volatility: float, days: int = 90) -> List[Dict]:
    """生成价格序列"""
    data = []
    price = initial_price
    daily_vol = volatility / math.sqrt(30)
    
    for day in range(days):
        # 随机游走 + 偶尔跳跃
        shock = random.gauss(0, daily_vol)
        if random.random() < 0.08:
            shock += random.choice([-1, 1]) * random.uniform(0.08, 0.20)
        
        price = price * math.exp(shock)
        price = max(0.05, min(0.95, price))
        
        # 每天4个数据点
        for hour in range(4):
            noise = random.gauss(0, daily_vol/3)
            data.append({
                "close": round(price * math.exp(noise), 4),
                "volume": int(random.uniform(3000, 80000))
            })
            price = data[-1]["close"]
    
    return data


def generate_signals(price_data: List[float], volumes: List[int]) -> Dict[str, float]:
    """生成模拟技术信号"""
    if len(price_data) < 20:
        return {k: 0 for k in ["rsi", "macd", "bollinger", "volume", "atr", "adx", "mean_reversion"]}
    
    # 简化的信号生成 - 基于价格趋势和波动
    recent = price_data[-20:]
    current = price_data[-1]
    avg_price = sum(recent) / len(recent)
    trend = (current - avg_price) / avg_price
    
    # RSI 模拟
    rsi = 1.0 if trend > 0.05 else -1.0 if trend < -0.05 else 0.0
    
    # 布林带模拟
    std = (sum((p - avg_price)**2 for p in recent) / len(recent)) ** 0.5
    bollinger = 1.0 if current > avg_price + 1.5*std else -1.0 if current < avg_price - 1.5*std else 0.0
    
    # 成交量
    avg_vol = sum(volumes[-10:]) / 10
    volume = 1.0 if volumes[-1] > avg_vol * 1.3 else -0.5 if volumes[-1] < avg_vol * 0.7 else 0.0
    
    # 均值回归
    mean_rev = 1.0 if trend < -0.1 else -1.0 if trend > 0.1 else 0.0
    
    # 波动率 (ATR模拟)
    recent_vol = [abs(price_data[i] - price_data[i-1]) for i in range(max(1, len(price_data)-10), len(price_data))]
    avg_recent_vol = sum(recent_vol) / len(recent_vol) if recent_vol else 0
    atr = -0.5 if avg_recent_vol > (sum(abs(price_data[i] - price_data[i-1]) for i in range(1, len(price_data))) / len(price_data)) * 1.3 else 0.5
    
    return {
        "rsi": rsi,
        "macd": 0.5 if trend > 0 else -0.5,
        "bollinger": bollinger,
        "volume": volume,
        "atr": atr,
        "adx": 0.5 if abs(trend) > 0.05 else 0.0,
        "mean_reversion": mean_rev
    }


def run_backtest(
    market_name: str,
    market_data: Dict,
    config: StrategyConfig,
    use_dynamic_tp: bool = True,
    use_time_decay: bool = True,
    use_liquidity_filter: bool = False,
    initial_capital: float = 1000,
    days: int = 90
) -> Dict:
    """回测"""
    
    # 流动性筛选
    if use_liquidity_filter:
        vol = market_data.get("volume", 0)
        if vol < config.min_volume or vol > config.max_volume:
            return {"status": "FILTERED", "volume": vol}
    
    prices = generate_price_series(market_data["current_yes"], market_data["volatility_1m"], days)
    volumes = [p["volume"] for p in prices]
    closes = [p["close"] for p in prices]
    
    capital = initial_capital
    position = 0
    entry_price = 0
    trades = []
    position_history = []
    
    total_hours = days * 24
    
    for i in range(30, len(prices)):  # warmup=30
        price = closes[i]
        vol = volumes[i]
        
        # 信号
        signals = generate_signals(closes[:i+1], volumes[:i+1])
        
        # 时间衰减
        current_hour = i * 6
        hours_left = total_hours - current_hour
        
        if use_time_decay and hours_left < config.time_decay_hours:
            decay = config.time_decay_strength * (1 - hours_left / config.time_decay_hours)
            signals["mean_reversion"] *= decay
        
        # 综合信号
        tech_sum = sum(signals.values()) / 7
        sentiment = market_data.get("news_sentiment", 0)
        
        w_tech = 1 - config.sentiment_weight
        w_sent = config.sentiment_weight
        
        final_signal = w_tech * tech_sum * config.R_max + w_sent * sentiment * config.R_max
        
        # 决策
        if final_signal > 0.03:
            action = "BUY"
        elif final_signal < -0.03:
            action = "SELL"
        else:
            action = "HOLD"
        
        # 止盈止损
        if position > 0:
            pnl = (price - entry_price) / entry_price
            
            if pnl <= -config.stop_loss:
                capital += position * price
                trades.append({"action": "STOP_LOSS", "profit": position * (price - entry_price)})
                position = 0
                entry_price = 0
                position_history = []
                continue
            
            if use_dynamic_tp:
                # 第一档 5%
                if pnl >= config.take_profit_1 and len(position_history) == 0:
                    exit_shares = int(position * config.exit_ratio_1)
                    capital += exit_shares * price
                    position -= exit_shares
                    position_history.append({"shares": exit_shares, "type": "TP1"})
                    trades.append({"action": "TP1_5%", "profit": exit_shares * (price - entry_price)})
                
                # 第二档 10%
                elif pnl >= config.take_profit_2 and len(position_history) == 1:
                    exit_shares = int(position * config.exit_ratio_2)
                    capital += exit_shares * price
                    position -= exit_shares
                    position_history.append({"shares": exit_shares, "type": "TP2"})
                    trades.append({"action": "TP2_10%", "profit": exit_shares * (price - entry_price)})
                
                # 第三档 15%+
                elif pnl >= config.take_profit_3 and position > 0:
                    capital += position * price
                    trades.append({"action": "TP3_15%+", "profit": position * (price - entry_price)})
                    position = 0
                    entry_price = 0
                    position_history = []
                    continue
            else:
                if pnl >= config.take_profit_1:
                    capital += position * price
                    trades.append({"action": "FIXED_TP", "profit": position * (price - entry_price)})
                    position = 0
                    entry_price = 0
                    continue
        
        # 开仓
        if action == "BUY" and position == 0:
            shares = (capital * config.R_max) / price
            cost = shares * price
            if cost < capital:
                position = shares
                entry_price = price
                capital -= cost
                trades.append({"action": "BUY", "price": price})
        
        # 平仓
        elif action == "SELL" and position > 0:
            capital += position * price
            trades.append({"action": "SELL", "profit": position * (price - entry_price)})
            position = 0
            entry_price = 0
            position_history = []
    
    # 最终平仓
    if position > 0:
        capital += position * closes[-1]
    
    return {
        "status": "SUCCESS",
        "initial_capital": initial_capital,
        "final_capital": capital,
        "return_pct": ((capital - initial_capital) / initial_capital) * 100,
        "num_trades": len(trades),
        "trades": trades
    }


def test_dynamic_tp():
    """测试1: 动态止盈"""
    print("\n" + "=" * 60)
    print("测试1: 动态止盈 vs 固定止盈")
    print("=" * 60)
    
    config = StrategyConfig()
    
    # 固定止盈
    r1 = run_backtest("fed", MARKETS["fed"], config, use_dynamic_tp=False, use_time_decay=False)
    
    # 动态止盈
    r2 = run_backtest("fed", MARKETS["fed"], config, use_dynamic_tp=True, use_time_decay=False)
    
    print(f"\n固定止盈 (5%):")
    print(f"  收益率: {r1['return_pct']:+.2f}% | 交易: {r1['num_trades']}")
    
    print(f"\n动态止盈 (5%/10%/15%分批):")
    print(f"  收益率: {r2['return_pct']:+.2f}% | 交易: {r2['num_trades']}")
    
    # 统计
    tp1 = sum(1 for t in r2['trades'] if 'TP1' in t['action'])
    tp2 = sum(1 for t in r2['trades'] if 'TP2' in t['action'])
    tp3 = sum(1 for t in r2['trades'] if 'TP3' in t['action'])
    print(f"  分批止盈: TP1={tp1}, TP2={tp2}, TP3={tp3}")
    
    return r1, r2


def test_time_decay():
    """测试2: 时间衰减"""
    print("\n" + "=" * 60)
    print("测试2: 时间衰减因子")
    print("=" * 60)
    
    config = StrategyConfig()
    
    r1 = run_backtest("fed", MARKETS["fed"], config, use_dynamic_tp=True, use_time_decay=False)
    r2 = run_backtest("fed", MARKETS["fed"], config, use_dynamic_tp=True, use_time_decay=True)
    
    print(f"\n无时间衰减:")
    print(f"  收益率: {r1['return_pct']:+.2f}% | 交易: {r1['num_trades']}")
    
    print(f"\n有时间衰减 (结算前24h反向信号x1.5):")
    print(f"  收益率: {r2['return_pct']:+.2f}% | 交易: {r2['num_trades']}")
    
    return r1, r2


def test_liquidity():
    """测试3: 流动性筛选"""
    print("\n" + "=" * 60)
    print("测试3: 流动性筛选")
    print("=" * 60)
    
    config = StrategyConfig()
    
    print("\n无筛选:")
    for name, m in MARKETS.items():
        r = run_backtest(name, m, config, use_dynamic_tp=True, use_time_decay=True, use_liquidity_filter=False)
        if r['status'] == 'SUCCESS':
            print(f"  {m['question'][:25]}: {r['return_pct']:+.2f}% (vol: ${m['volume']:,})")
    
    print("\n有筛选 (50K-2M):")
    for name, m in MARKETS.items():
        r = run_backtest(name, m, config, use_dynamic_tp=True, use_time_decay=True, use_liquidity_filter=True)
        if r['status'] == 'FILTERED':
            print(f"  ❌ {m['question'][:25]}: 被过滤 (vol: ${r['volume']:,})")
        else:
            print(f"  ✅ {m['question'][:25]}: {r['return_pct']:+.2f}%")


def test_all():
    """综合测试"""
    print("\n" + "=" * 60)
    print("综合测试: 全部改进")
    print("=" * 60)
    
    config = StrategyConfig()
    results = []
    
    for name, m in MARKETS.items():
        r = run_backtest(name, m, config, use_dynamic_tp=True, use_time_decay=True, use_liquidity_filter=False)
        if r['status'] == 'SUCCESS':
            results.append(r)
            print(f"\n{m['question'][:30]}")
            print(f"  收益率: {r['return_pct']:+.2f}%")
            print(f"  交易次数: {r['num_trades']}")
    
    if results:
        avg = sum(r['return_pct'] for r in results) / len(results)
        total = sum(r['num_trades'] for r in results)
        print(f"\n平均收益率: {avg:+.2f}%")
        print(f"总交易次数: {total}")


if __name__ == "__main__":
    print("=" * 60)
    print("Polymarket 策略 V2 - 改进参数测试")
    print("=" * 60)
    
    test_dynamic_tp()
    test_time_decay()
    test_liquidity()
    test_all()
    
    print("\n" + "=" * 60)
    print("✅ 测试完成!")
    print("=" * 60)
