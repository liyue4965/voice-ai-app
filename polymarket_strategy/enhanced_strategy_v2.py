#!/usr/bin/env python3
"""
Polymarket 7-Signal Strategy - V2 (改进版)
================================================
新增测试:
1. 动态止盈 (分批卖出)
2. 时间衰减因子 (结算前反向信号增强)
3. 流动性筛选
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json

random.seed(42)

# ==================== CONFIGURATION ====================

class StrategyConfig:
    """策略配置 V2"""
    def __init__(self):
        # 风险参数
        self.R_max = 0.20
        
        # 信号权重
        self.weights = {
            "rsi": 1.0,
            "macd": 1.0,
            "bollinger": 1.0,
            "volume": 0.8,
            "atr": 0.7,
            "adx": 1.2,
            "mean_reversion": 0.8
        }
        
        # 基本面参数
        self.sentiment_weight = 0.3
        self.sentiment_threshold = 0.2
        
        # 交易参数
        self.stop_loss = 0.03       # 止损 3%
        
        # === 动态止盈参数 (调整后) ===
        self.take_profit_1 = 0.08   # 第一档止盈 8%
        self.take_profit_2 = 0.15   # 第二档止盈 15%
        self.take_profit_3 = 0.25   # 第三档止盈 25%
        self.exit_ratio_1 = 0.4     # 第一档卖出 40%
        self.exit_ratio_2 = 0.6     # 第二档卖出 60% (剩余的)
        
        # === 时间衰减因子 (调整后) ===
        self.time_decay_enabled = True
        self.time_decay_hours = 48  # 结算前48小时开始增强
        self.time_decay_strength = 1.2  # 反向信号增强倍数降低
        
        # === 新增: 流动性筛选 ===
        self.min_volume = 50000     # 最小成交量
        self.max_volume = 2000000  # 最大成交量
        
        # 最小置信度 (降低以产生更多交易)
        self.min_confidence = 0.01
        
        # 信号阈值 (降低以产生更多信号)
        self.signal_threshold = 0.01

    def to_dict(self):
        return {
            "R_max": self.R_max,
            "weights": self.weights,
            "sentiment_weight": self.sentiment_weight,
            "stop_loss": self.stop_loss,
            "take_profit_1": self.take_profit_1,
            "take_profit_2": self.take_profit_2,
            "take_profit_3": self.take_profit_3,
            "exit_ratio_1": self.exit_ratio_1,
            "exit_ratio_2": self.exit_ratio_2,
            "time_decay_enabled": self.time_decay_enabled,
            "time_decay_hours": self.time_decay_hours,
            "time_decay_strength": self.time_decay_strength,
            "min_volume": self.min_volume,
            "max_volume": self.max_volume
        }


# ==================== MARKET DATA ====================

MARKETS = {
    "bitboy_convicted": {
        "question": "BitBoy convicted?",
        "current_yes": 0.224,
        "volume": 122077,
        "volatility_1m": 0.4025,
        "end_date": "2026-03-31",
        "news_sentiment": -0.3,
    },
    "russia_ukraine_gta": {
        "question": "Russia-Ukraine Ceasefire before GTA VI?",
        "current_yes": 0.535,
        "volume": 1388182,
        "volatility_1m": 0.04,
        "end_date": "2026-07-31",
        "news_sentiment": 0.1,
    },
    "fed_rate": {
        "question": "Fed cuts rates in March 2026?",
        "current_yes": 0.35,
        "volume": 850000,
        "volatility_1m": 0.25,
        "end_date": "2026-03-19",
        "news_sentiment": 0.2,
    },
    # 低流动性市场
    "low_volume_test": {
        "question": "Test Low Volume Market",
        "current_yes": 0.50,
        "volume": 30000,
        "volatility_1m": 0.60,
        "end_date": "2026-04-30",
        "news_sentiment": 0.0,
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
        shock = random.gauss(0, daily_vol)
        if random.random() < 0.05:
            shock += random.choice([-1, 1]) * random.uniform(0.05, 0.15)
        
        price = price * math.exp(shock)
        price = max(0.01, min(0.99, price))
        
        for hour in range(4):
            ts = base_time + timedelta(days=day, hours=hour*6)
            noise = random.gauss(0, daily_vol/4)
            
            data.append({
                "timestamp": ts.isoformat(),
                "open": round(price, 4),
                "high": round(price * (1 + abs(noise)), 4),
                "low": round(price * (1 - abs(noise)), 4),
                "close": round(price * math.exp(noise), 4),
                "volume": int(random.uniform(5000, 50000)),
                "hour_index": day * 4 + hour
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
    
    weighted_signals = {
        name: value * config.weights.get(name, 1.0) 
        for name, value in raw_signals.items()
    }
    
    return weighted_signals


def calculate_sentiment_signal(market_data: Dict, config: StrategyConfig) -> float:
    """基本面信号 - 新闻情绪分析"""
    sentiment = market_data.get("news_sentiment", 0.0)
    
    if abs(sentiment) < config.sentiment_threshold:
        return 0.0
    
    return sentiment


def apply_time_decay(
    tech_signals: Dict[str, float],
    current_hour: int,
    total_hours: int,
    config: StrategyConfig
) -> Dict[str, float]:
    """
    === 新增: 时间衰减因子 ===
    结算前 < 24h 时，增强反向信号 (均值回归信号)
    """
    if not config.time_decay_enabled:
        return tech_signals
    
    # 剩余小时数
    hours_left = total_hours - current_hour
    
    # 只有在结算前 N 小时内才触发
    if hours_left > config.time_decay_hours:
        return tech_signals
    
    # 越接近结算，反向信号越强
    decay_factor = config.time_decay_strength * (1 - hours_left / config.time_decay_hours)
    
    # 增强均值回归信号 (反向交易)
    enhanced = tech_signals.copy()
    if "mean_reversion" in enhanced:
        enhanced["mean_reversion"] = tech_signals["mean_reversion"] * decay_factor
    
    return enhanced


def check_liquidity_filter(market_data: Dict, config: StrategyConfig) -> bool:
    """=== 新增: 流动性筛选 ==="""
    volume = market_data.get("volume", 0)
    return config.min_volume <= volume <= config.max_volume


def combine_signals(
    tech_signals: Dict[str, float], 
    sentiment: float,
    config: StrategyConfig,
    current_hour: int = 0,
    total_hours: int = 90 * 24
) -> Tuple[float, str, float, Dict]:
    """组合信号 + 时间衰减"""
    
    # 应用时间衰减
    if config.time_decay_enabled:
        tech_signals = apply_time_decay(tech_signals, current_hour, total_hours, config)
    
    # 技术信号综合
    tech_sum = sum(tech_signals.values())
    tech_normalized = (config.R_max / 7) * tech_sum
    
    # 基本面信号
    sentiment_signal = sentiment * config.R_max
    
    # 权重组合
    w_tech = 1 - config.sentiment_weight
    w_sent = config.sentiment_weight
    
    final_signal = w_tech * tech_normalized + w_sent * sentiment_signal
    
    # 决策 (使用可调阈值)
    threshold = getattr(config, 'signal_threshold', 0.15)
    if final_signal > threshold:
        action = "BUY"
    elif final_signal < -threshold:
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
        "signal_alignment": non_zero,
        "time_decay": config.time_decay_enabled
    }
    
    return final_signal, action, confidence, breakdown


# ==================== BACKTEST ====================

def run_backtest_v2(
    market_name: str,
    market_data: Dict,
    config: StrategyConfig,
    initial_capital: float = 1000,
    days: int = 90,
    use_dynamic_tp: bool = True,
    use_time_decay: bool = True,
    use_liquidity_filter: bool = False
) -> Dict:
    """回测 V2 策略"""
    
    # 流动性筛选
    if use_liquidity_filter and not check_liquidity_filter(market_data, config):
        return {
            "market": market_name,
            "question": market_data["question"],
            "status": "FILTERED",
            "reason": "流动性不符合要求",
            "volume": market_data.get("volume", 0)
        }
    
    price_series = generate_price_series(
        market_data["current_yes"],
        market_data["volatility_1m"],
        days
    )
    
    capital = initial_capital
    position = 0
    entry_price = 0
    trades = []
    
    # 持仓信息
    position_history = []  # 分批持仓
    
    warmup = 50
    total_hours = days * 24
    
    for i in range(warmup, len(price_series)):
        data = price_series[:i+1]
        current_hour = i * 6  # 每条数据代表6小时
        
        # 计算信号
        tech_signals = calculate_technical_signals(data, config)
        sentiment = calculate_sentiment_signal(market_data, config)
        
        # 时间衰减开关
        test_config = StrategyConfig()
        test_config.time_decay_enabled = use_time_decay
        
        signal, action, confidence, breakdown = combine_signals(
            tech_signals, sentiment, test_config,
            current_hour=current_hour, 
            total_hours=total_hours
        )
        
        current_price = price_series[i]["close"]
        
        # === 动态止盈逻辑 ===
        if position > 0:
            pnl_pct = (current_price - entry_price) / entry_price
            
            # 止损
            if pnl_pct <= -config.stop_loss:
                capital += position * current_price
                trades.append({
                    "day": i, "action": "STOP_LOSS", "price": current_price,
                    "profit": position * (current_price - entry_price),
                    "reason": f"Stop loss {config.stop_loss*100}%"
                })
                position = 0
                entry_price = 0
                position_history = []
                continue
            
            # 动态止盈 - 分批卖出
            if use_dynamic_tp:
                # 第一档止盈 5%
                if pnl_pct >= config.take_profit_1 and len(position_history) == 0:
                    exit_shares = int(position * config.exit_ratio_1)
                    capital += exit_shares * current_price
                    position -= exit_shares
                    position_history.append({
                        "shares": exit_shares,
                        "exit_price": current_price,
                        "exit_type": "TP1"
                    })
                    trades.append({
                        "day": i, "action": "TAKE_PROFIT_1", "price": current_price,
                        "shares": exit_shares, "profit": exit_shares * (current_price - entry_price),
                        "reason": f"First tier profit {config.take_profit_1*100}%"
                    })
                
                # 第二档止盈 10%
                elif pnl_pct >= config.take_profit_2 and len(position_history) == 1:
                    exit_shares = int(position * config.exit_ratio_2)
                    capital += exit_shares * current_price
                    position -= exit_shares
                    position_history.append({
                        "shares": exit_shares,
                        "exit_price": current_price,
                        "exit_type": "TP2"
                    })
                    trades.append({
                        "day": i, "action": "TAKE_PROFIT_2", "price": current_price,
                        "shares": exit_shares, "profit": exit_shares * (current_price - entry_price),
                        "reason": f"Second tier profit {config.take_profit_2*100}%"
                    })
                
                # 第三档止盈 15% 或更高，全部清仓
                elif pnl_pct >= config.take_profit_3 and position > 0:
                    capital += position * current_price
                    trades.append({
                        "day": i, "action": "TAKE_PROFIT_3", "price": current_price,
                        "shares": position, "profit": position * (current_price - entry_price),
                        "reason": f"Final tier profit {config.take_profit_3*100}%"
                    })
                    position = 0
                    entry_price = 0
                    position_history = []
                    continue
            else:
                # 原有止盈逻辑
                if pnl_pct >= config.take_profit_1:
                    capital += position * current_price
                    trades.append({
                        "day": i, "action": "TAKE_PROFIT", "price": current_price,
                        "profit": position * (current_price - entry_price),
                        "reason": f"Take profit {config.take_profit_1*100}%"
                    })
                    position = 0
                    entry_price = 0
                    continue
        
        # 交易逻辑 (降低置信度要求)
        min_conf = getattr(config, 'min_confidence', 0.01)
        if action == "BUY" and position == 0 and confidence > 0:
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
            position_history = []
    
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
        "trades": trades,
        "status": "SUCCESS"
    }


# ==================== TEST FUNCTIONS ====================

def test_dynamic_take_profit():
    """测试1: 动态止盈 vs 固定止盈"""
    print("\n" + "=" * 70)
    print("测试1: 动态止盈 vs 固定止盈")
    print("=" * 70)
    
    config = StrategyConfig()
    market = MARKETS["fed_rate"]
    
    # 固定止盈
    result_fixed = run_backtest_v2(
        "fed_rate", market, config,
        use_dynamic_tp=False, use_time_decay=False, use_liquidity_filter=False
    )
    
    # 动态止盈
    result_dynamic = run_backtest_v2(
        "fed_rate", market, config,
        use_dynamic_tp=True, use_time_decay=False, use_liquidity_filter=False
    )
    
    print(f"\n固定止盈 ({config.take_profit_1*100}%):")
    print(f"  收益率: {result_fixed['total_return']:+.2f}%")
    print(f"  交易次数: {result_fixed['num_trades']}")
    
    print(f"\n动态止盈 (分批 {config.take_profit_1*100}% / {config.take_profit_2*100}% / {config.take_profit_3*100}%):")
    print(f"  收益率: {result_dynamic['total_return']:+.2f}%")
    print(f"  交易次数: {result_dynamic['num_trades']}")
    
    # 统计止盈分布
    tp1_count = sum(1 for t in result_dynamic['trades'] if 'TAKE_PROFIT_1' in t['action'])
    tp2_count = sum(1 for t in result_dynamic['trades'] if 'TAKE_PROFIT_2' in t['action'])
    tp3_count = sum(1 for t in result_dynamic['trades'] if 'TAKE_PROFIT_3' in t['action'])
    
    print(f"\n分批止盈分布:")
    print(f"  第一档 (5%): {tp1_count} 次")
    print(f"  第二档 (10%): {tp2_count} 次")
    print(f"  第三档 (15%+): {tp3_count} 次")
    
    return result_fixed, result_dynamic


def test_time_decay():
    """测试2: 时间衰减因子"""
    print("\n" + "=" * 70)
    print("测试2: 时间衰减因子 (结算前反向信号增强)")
    print("=" * 70)
    
    config = StrategyConfig()
    market = MARKETS["fed_rate"]
    
    # 无时间衰减
    result_no_decay = run_backtest_v2(
        "fed_rate", market, config,
        use_dynamic_tp=True, use_time_decay=False, use_liquidity_filter=False
    )
    
    # 有时间衰减
    result_with_decay = run_backtest_v2(
        "fed_rate", market, config,
        use_dynamic_tp=True, use_time_decay=True, use_liquidity_filter=False
    )
    
    print(f"\n无时间衰减:")
    print(f"  收益率: {result_no_decay['total_return']:+.2f}%")
    print(f"  交易次数: {result_no_decay['num_trades']}")
    
    print(f"\n有时间衰减 (结算前24h反向信号 x1.5):")
    print(f"  收益率: {result_with_decay['total_return']:+.2f}%")
    print(f"  交易次数: {result_with_decay['num_trades']}")
    
    return result_no_decay, result_with_decay


def test_liquidity_filter():
    """测试3: 流动性筛选"""
    print("\n" + "=" * 70)
    print("测试3: 流动性筛选")
    print("=" * 70)
    
    config = StrategyConfig()
    
    # 无筛选
    print("\n无流动性筛选:")
    for market_name, market_data in MARKETS.items():
        result = run_backtest_v2(
            market_name, market_data, config,
            use_dynamic_tp=True, use_time_decay=True, use_liquidity_filter=False
        )
        if result.get('status') == 'SUCCESS':
            print(f"  {market_data['question'][:30]}: {result['total_return']:+.2f}% (vol: ${market_data['volume']:,})")
    
    # 有筛选
    print("\n有流动性筛选 (min: $50K, max: $2M):")
    for market_name, market_data in MARKETS.items():
        result = run_backtest_v2(
            market_name, market_data, config,
            use_dynamic_tp=True, use_time_decay=True, use_liquidity_filter=True
        )
        if result.get('status') == 'FILTERED':
            print(f"  ❌ {market_data['question'][:30]}: 被过滤 (vol: ${market_data['volume']:,})")
        elif result.get('status') == 'SUCCESS':
            print(f"  ✅ {market_data['question'][:30]}: {result['total_return']:+.2f}% (vol: ${market_data['volume']:,})")


def test_all_markets():
    """所有市场综合测试"""
    print("\n" + "=" * 70)
    print("综合测试: 所有市场 (动态止盈 + 时间衰减)")
    print("=" * 70)
    
    config = StrategyConfig()
    results = []
    
    for market_name, market_data in MARKETS.items():
        result = run_backtest_v2(
            market_name, market_data, config,
            use_dynamic_tp=True, use_time_decay=True, use_liquidity_filter=False
        )
        if result.get('status') == 'SUCCESS':
            results.append(result)
            print(f"\n{market_data['question'][:40]}")
            print(f"  收益率: {result['total_return']:+.2f}%")
            print(f"  交易次数: {result['num_trades']}")
    
    avg_return = sum(r['total_return'] for r in results) / len(results)
    total_trades = sum(r['num_trades'] for r in results)
    
    print(f"\n{'='*50}")
    print(f"平均收益率: {avg_return:+.2f}%")
    print(f"总交易次数: {total_trades}")
    
    return results


# ==================== MAIN ====================

if __name__ == "__main__":
    print("=" * 70)
    print("Polymarket 7-Signal 策略 V2 - 改进测试")
    print("=" * 70)
    
    # 测试1: 动态止盈
    test_dynamic_take_profit()
    
    # 测试2: 时间衰减
    test_time_decay()
    
    # 测试3: 流动性筛选
    test_liquidity_filter()
    
    # 综合测试
    test_all_markets()
    
    print("\n" + "=" * 70)
    print("✅ 测试完成!")
    print("=" * 70)
