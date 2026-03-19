#!/usr/bin/env python3
"""
Polymarket 7-Signal Strategy - Enhanced Version
================================================
1. 可调参数: R_max + 信号权重
2. 加入基本面: 新闻情绪分析 (简化版 MiroFish)
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json

random.seed(42)  # 固定随机种子

# ==================== CONFIGURATION ====================

class StrategyConfig:
    """策略配置"""
    def __init__(self):
        # 风险参数
        self.R_max = 0.20  # 最大风险敞口 - 最优配置
        
        # 信号权重 (可调整)
        self.weights = {
            "rsi": 1.0,           # RSI 动量
            "macd": 1.0,          # MACD 交叉
            "bollinger": 1.0,     # 布林带突破
            "volume": 0.8,        # 成交量确认
            "atr": 0.7,           # ATR 波动率
            "adx": 1.2,           # ADX 趋势强度
            "mean_reversion": 0.8 # 均值回归
        }
        
        # 基本面参数
        self.sentiment_weight = 0.3  # 新闻情绪权重 (0-1)
        self.sentiment_threshold = 0.2  # 情绪触发阈值
        
        # 交易参数 - 最优配置
        self.min_confidence = 0.05  # 最小置信度
        self.stop_loss = 0.03       # 止损 3%
        self.take_profit = 0.06     # 止盈 6%

    def to_dict(self):
        return {
            "R_max": self.R_max,
            "weights": self.weights,
            "sentiment_weight": self.sentiment_weight,
            "sentiment_threshold": self.sentiment_threshold,
            "min_confidence": self.min_confidence,
            "stop_loss": self.stop_loss,
            "take_profit": self.take_profit
        }


# ==================== MARKET DATA ====================

MARKETS = {
    "bitboy_convicted": {
        "question": "BitBoy convicted?",
        "current_yes": 0.224,
        "volume": 122077,
        "volatility_1m": 0.4025,
        "end_date": "2026-03-31",
        # 模拟新闻情绪 (实际应从API获取)
        "news_sentiment": -0.3,  # 负面: 被逮捕
    },
    "russia_ukraine_gta": {
        "question": "Russia-Ukraine Ceasefire before GTA VI?",
        "current_yes": 0.535,
        "volume": 1388182,
        "volatility_1m": 0.04,
        "end_date": "2026-07-31",
        "news_sentiment": 0.1,   # 中性偏正面
    },
    "fed_rate": {
        "question": "Fed cuts rates in March 2026?",
        "current_yes": 0.35,
        "volume": 850000,
        "volatility_1m": 0.25,
        "end_date": "2026-03-19",
        "news_sentiment": 0.2,   # 正面: 经济数据好
    },
}


# ==================== PRICE GENERATOR ====================

def generate_price_series(initial_price: float, volatility: float, days: int = 90) -> List[Dict]:
    """基于真实波动率生成价格序列"""
    data = []
    price = initial_price
    daily_vol = volatility / math.sqrt(30)
    base_time = datetime(2026, 2, 1)
    
    for day in range(days):
        # GBM + 跳跃
        shock = random.gauss(0, daily_vol)
        if random.random() < 0.05:
            shock += random.choice([-1, 1]) * random.uniform(0.05, 0.15)
        
        price = price * math.exp(shock)
        price = max(0.01, min(0.99, price))
        
        # 日内数据
        for hour in range(4):
            ts = base_time + timedelta(days=day, hours=hour*6)
            noise = random.gauss(0, daily_vol/4)
            
            data.append({
                "timestamp": ts.isoformat(),
                "open": round(price, 4),
                "high": round(price * (1 + abs(noise)), 4),
                "low": round(price * (1 - abs(noise)), 4),
                "close": round(price * math.exp(noise), 4),
                "volume": int(random.uniform(5000, 50000))
            })
            price = data[-1]["close"]
    
    return data


# ==================== TECHNICAL INDICATORS ====================

def calc_rsi(prices: List[float], period: int = 14) -> float:
    if len(prices) < period + 1:
        return 0.0
    
    gains = [max(0, prices[i] - prices[i-1]) for i in range(1, period+1)]
    losses = [max(0, prices[i-1] - prices[i]) for i in range(1, period+1)]
    
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    
    if avg_loss == 0:
        return 1.0 if avg_gain > 0 else 0.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return 1.0 if rsi < 30 else -1.0 if rsi > 70 else 0.0


def calc_macd(prices: List[float]) -> float:
    if len(prices) < 26:
        return 0.0
    
    def ema(data, p):
        k = 2 / (p + 1)
        e = data[0]
        for v in data[1:]:
            e = v * k + e * (1 - k)
        return e
    
    ema12 = ema(prices, 12)
    ema26 = ema(prices, 26)
    macd = ema12 - ema26
    
    return 0.5 if macd > 0 else -0.5


def calc_bollinger(prices: List[float], period: int = 20) -> float:
    if len(prices) < period:
        return 0.0
    
    recent = prices[-period:]
    sma = sum(recent) / period
    std = (sum((p - sma)**2 for p in recent) / period) ** 0.5
    
    current = prices[-1]
    if current > sma + 2*std:
        return 1.0
    elif current < sma - 2*std:
        return -1.0
    return 0.0


def calc_volume(volumes: List[int]) -> float:
    if len(volumes) < 20:
        return 0.0
    
    avg = sum(volumes[-20:]) / 20
    return 1.0 if volumes[-1] > avg * 1.5 else -0.5 if volumes[-1] < avg * 0.5 else 0.0


def calc_atr(highs, lows, closes, period: int = 14) -> float:
    if len(highs) < period + 1:
        return 0.0
    
    tr = [max(highs[i] - lows[i], 
               abs(highs[i] - closes[i-1]), 
               abs(lows[i] - closes[i-1])) 
          for i in range(1, period+1)]
    
    atr = sum(tr) / period
    return 1.0 if atr < sum(tr)/period * 0.7 else -0.5 if atr > sum(tr)/period * 1.3 else 0.0


def calc_adx(highs, lows, closes, period: int = 14) -> float:
    if len(highs) < period + 1:
        return 0.0
    
    plus_dm = [max(0, highs[i] - highs[i-1]) if highs[i] - highs[i-1] > lows[i-1] - lows[i] else 0 
               for i in range(1, period+1)]
    minus_dm = [max(0, lows[i-1] - lows[i]) if lows[i-1] - lows[i] > highs[i] - highs[i-1] else 0 
                for i in range(1, period+1)]
    
    tr = [max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1])) 
          for i in range(1, period+1)]
    
    plus_di = (sum(plus_dm)/period) / (sum(tr)/period) * 100
    minus_di = (sum(minus_dm)/period) / (sum(tr)/period) * 100
    
    dx = abs(plus_di - minus_di) / (plus_di + minus_di) * 100 if (plus_di + minus_di) > 0 else 0
    
    return 1.0 if dx > 25 and plus_di > minus_di else -1.0 if dx > 25 else 0.0


def calc_mean_reversion(prices: List[float], period: int = 20) -> float:
    if len(prices) < period:
        return 0.0
    
    sma = sum(prices[-period:]) / period
    deviation = (prices[-1] - sma) / sma
    
    return 1.0 if deviation < -0.15 else -1.0 if deviation > 0.15 else 0.0


# ==================== SIGNAL CALCULATION ====================

def calculate_technical_signals(data: List[Dict], config: StrategyConfig) -> Dict[str, float]:
    """计算技术信号 (带权重)"""
    closes = [d["close"] for d in data]
    highs = [d["high"] for d in data]
    lows = [d["low"] for d in data]
    volumes = [d["volume"] for d in data]
    
    raw_signals = {
        "rsi": calc_rsi(closes),
        "macd": calc_macd(closes),
        "bollinger": calc_bollinger(closes),
        "volume": calc_volume(volumes),
        "atr": calc_atr(highs, lows, closes),
        "adx": calc_adx(highs, lows, closes),
        "mean_reversion": calc_mean_reversion(closes)
    }
    
    # 应用权重
    weighted_signals = {
        name: value * config.weights.get(name, 1.0) 
        for name, value in raw_signals.items()
    }
    
    return weighted_signals


def calculate_sentiment_signal(market_data: Dict, config: StrategyConfig) -> float:
    """
    基本面信号 - 新闻情绪分析
    模拟 MiroFish 的行为模拟功能
    
    返回: -1 到 1 之间的情绪分数
    """
    sentiment = market_data.get("news_sentiment", 0.0)
    
    # 情绪强度分类
    if abs(sentiment) < config.sentiment_threshold:
        return 0.0  # 情绪不显著
    
    # 正面情绪 = 预期上涨 (买入Yes)
    # 负面情绪 = 预期下跌 (卖出/观望)
    return sentiment


def combine_signals(
    tech_signals: Dict[str, float], 
    sentiment: float,
    config: StrategyConfig
) -> Tuple[float, str, float, Dict]:
    """
    组合技术信号 + 基本面情绪
    
    公式: R(t) = (1 - sentiment_weight) * R_tech + sentiment_weight * R_sentiment
    """
    # 技术信号综合
    tech_sum = sum(tech_signals.values())
    tech_normalized = (config.R_max / 7) * tech_sum
    
    # 基本面信号
    sentiment_signal = sentiment * config.R_max
    
    # 权重组合
    w_tech = 1 - config.sentiment_weight
    w_sent = config.sentiment_weight
    
    final_signal = w_tech * tech_normalized + w_sent * sentiment_signal
    
    # 决策
    if final_signal > config.R_max * 0.3:
        action = "BUY"
    elif final_signal < -config.R_max * 0.3:
        action = "SELL"
    else:
        action = "HOLD"
    
    # 置信度
    non_zero = len([s for s in tech_signals.values() if s != 0])
    confidence = abs(final_signal) * (non_zero / 7)
    
    breakdown = {
        "technical": tech_normalized,
        "sentiment": sentiment_signal,
        "final": final_signal,
        "tech_weight": w_tech,
        "sentiment_weight": w_sent,
        "signal_alignment": non_zero
    }
    
    return final_signal, action, confidence, breakdown


# ==================== BACKTEST ====================

def run_backtest(
    market_name: str,
    market_data: Dict,
    config: StrategyConfig,
    initial_capital: float = 1000,
    days: int = 90
) -> Dict:
    """回测增强版策略"""
    
    price_series = generate_price_series(
        market_data["current_yes"],
        market_data["volatility_1m"],
        days
    )
    
    capital = initial_capital
    position = 0
    entry_price = 0
    trades = []
    
    warmup = 50
    
    for i in range(warmup, len(price_series)):
        data = price_series[:i+1]
        
        # 计算信号
        tech_signals = calculate_technical_signals(data, config)
        sentiment = calculate_sentiment_signal(market_data, config)
        signal, action, confidence, breakdown = combine_signals(tech_signals, sentiment, config)
        
        current_price = price_series[i]["close"]
        
        # 止损/止盈检查
        if position > 0:
            pnl_pct = (current_price - entry_price) / entry_price
            
            if pnl_pct <= -config.stop_loss:
                # 止损
                capital += position * current_price
                trades.append({
                    "day": i, "action": "STOP_LOSS", "price": current_price,
                    "profit": position * (current_price - entry_price),
                    "reason": f"Stop loss {config.stop_loss*100}%"
                })
                position = 0
                entry_price = 0
                continue
                
            elif pnl_pct >= config.take_profit:
                # 止盈
                capital += position * current_price
                trades.append({
                    "day": i, "action": "TAKE_PROFIT", "price": current_price,
                    "profit": position * (current_price - entry_price),
                    "reason": f"Take profit {config.take_profit*100}%"
                })
                position = 0
                entry_price = 0
                continue
        
        # 交易逻辑
        if action == "BUY" and position == 0 and confidence > config.min_confidence * 0.5:
            shares = (capital * config.R_max) / current_price
            cost = shares * current_price
            if cost < capital:
                position = shares
                entry_price = current_price
                capital -= cost
                trades.append({
                    "day": i, "action": "BUY", "price": current_price,
                    "shares": shares, "confidence": confidence,
                    "breakdown": breakdown
                })
        
        elif action == "SELL" and position > 0:
            capital += position * current_price
            trades.append({
                "day": i, "action": "SELL", "price": current_price,
                "shares": position, "profit": position * (current_price - entry_price),
                "confidence": confidence
            })
            position = 0
            entry_price = 0
    
    # 平仓
    if position > 0:
        capital += position * price_series[-1]["close"]
    
    total_return = ((capital - initial_capital) / initial_capital) * 100
    
    return {
        "market": market_name,
        "question": market_data["question"],
        "initial_capital": initial_capital,
        "final_capital": capital,
        "total_return": total_return,
        "num_trades": len(trades),
        "trades": trades
    }


# ==================== PARAMETER OPTIMIZATION ====================

def optimize_parameters():
    """参数优化测试"""
    print("\n" + "=" * 70)
    print("参数优化测试")
    print("=" * 70)
    
    # 测试不同 R_max
    test_configs = [
        ("保守 R_max=0.3", 0.3, 0.2),
        ("平衡 R_max=0.5", 0.5, 0.3),
        ("激进 R_max=0.8", 0.8, 0.4),
        ("高情绪权重 0.5", 0.5, 0.5),
        ("低情绪权重 0.1", 0.5, 0.1),
    ]
    
    market = MARKETS["fed_rate"]  # 用 Fed 市场测试
    
    results = []
    
    for name, r_max, sent_weight in test_configs:
        config = StrategyConfig()
        config.R_max = r_max
        config.sentiment_weight = sent_weight
        
        result = run_backtest("fed_rate", market, config, initial_capital=1000, days=90)
        
        results.append({
            "name": name,
            "return": result["total_return"],
            "trades": result["num_trades"]
        })
        
        print(f"\n{name}")
        print(f"  Return: {result['total_return']:+.2f}% | Trades: {result['num_trades']}")
    
    return results


# ==================== MAIN ====================

if __name__ == "__main__":
    print("=" * 70)
    print("Polymarket 7-Signal + 新闻情绪策略 (增强版)")
    print("=" * 70)
    
    # 默认配置
    config = StrategyConfig()
    
    print("\n[当前配置]")
    print(f"  R_max: {config.R_max}")
    print(f"  信号权重: {config.weights}")
    print(f"  情绪权重: {config.sentiment_weight}")
    print(f"  止损: {config.stop_loss*100}%")
    print(f"  止盈: {config.take_profit*100}%")
    
    # 参数优化
    optimize_parameters()
    
    # 使用优化后的配置回测所有市场
    print("\n" + "=" * 70)
    print("所有市场回测 (优化配置)")
    print("=" * 70)
    
    # 最佳配置
    best_config = StrategyConfig()
    best_config.R_max = 0.5
    best_config.sentiment_weight = 0.3
    
    all_results = []
    
    for market_name, market_data in MARKETS.items():
        result = run_backtest(market_name, market_data, best_config, initial_capital=1000, days=90)
        all_results.append(result)
        
        print(f"\n{market_data['question'][:50]}")
        print(f"  收益率: {result['total_return']:+.2f}%")
        print(f"  交易次数: {result['num_trades']}")
        
        # 显示交易详情
        if result['trades']:
            for t in result['trades'][:3]:
                profit = t.get('profit', 0)
                print(f"    {t['action']:10s} @ ${t['price']:.4f} | P/L: ${profit:+.2f}")
    
    # 汇总
    print("\n" + "=" * 70)
    print("汇总")
    print("=" * 70)
    
    total_return = sum(r['total_return'] for r in all_results) / len(all_results)
    total_trades = sum(r['num_trades'] for r in all_results)
    
    print(f"  平均收益率: {total_return:+.2f}%")
    print(f"  总交易次数: {total_trades}")
    
    print("\n" + "=" * 70)
    print("✅ 优化完成!")
    print("=" * 70)
