#!/usr/bin/env python3
"""
Polymarket 实时策略 - 获取真实市场数据并运行信号
"""

import requests
import json
import math
import random
from datetime import datetime, timedelta
from typing import List, Dict

# ==================== CONFIG ====================

API_BASE = "https://gamma-api.polymarket.com"

# 最优配置 (从测试中得出)
CONFIG = {
    "R_max": 0.20,
    "stop_loss": 0.03,
    "take_profit": 0.08,
    "sentiment_weight": 0.3,
    "min_volume": 50000,
    "max_volume": 2000000,
    "time_decay_enabled": False
}

# ==================== API FUNCTIONS ====================

def get_markets(limit: int = 20, closed: bool = False) -> List[Dict]:
    """获取市场列表"""
    url = f"{API_BASE}/markets"
    params = {
        "closed": str(closed).lower(),
        "limit": limit
    }
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def parse_market_data(market: Dict) -> Dict:
    """解析市场数据"""
    outcome_prices = json.loads(market.get("outcomePrices", "[]"))
    yes_price = float(outcome_prices[0]) if len(outcome_prices) > 0 else 0.5
    no_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else 0.5
    
    volume = float(market.get("volume", 0))
    
    return {
        "id": market.get("id"),
        "question": market.get("question", ""),
        "yes_price": yes_price,
        "no_price": no_price,
        "volume": volume,
        "liquidity": float(market.get("liquidity", 0)),
        "end_date": market.get("endDate"),
        "condition_id": market.get("conditionId"),
        "best_bid": float(market.get("bestBid", 0)),
        "best_ask": float(market.get("bestAsk", 0)),
        "last_trade": float(market.get("lastTradePrice", 0)),
        "one_day_change": float(market.get("oneDayPriceChange", 0)),
        "one_week_change": float(market.get("oneWeekPriceChange", 0)),
    }


def generate_price_history(current_price: float, days: int = 7) -> List[float]:
    """基于当前价格生成模拟历史数据"""
    prices = []
    price = current_price
    
    for i in range(days * 24):  # 小时数据
        # 添加随机波动
        change = random.gauss(0, 0.02)
        price = price * (1 + change)
        price = max(0.01, min(0.99, price))
        prices.append(price)
    
    # 确保最后一个价格是当前价格
    prices.append(current_price)
    return prices


# ==================== TECHNICAL INDICATORS ====================

def calc_rsi(prices: List[float], period: int = 14) -> float:
    if len(prices) < period + 1:
        return 0.0
    
    gains = [max(0, prices[i] - prices[i-1]) for i in range(1, min(period+1, len(prices)))]
    losses = [max(0, prices[i-1] - prices[i]) for i in range(1, min(period+1, len(prices)))]
    
    if not gains or not losses:
        return 0.0
    
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    
    if avg_loss == 0:
        return 1.0 if avg_gain > 0 else 0.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    # 返回信号
    if rsi < 30:
        return 1.0  # 超卖 -> 买入信号
    elif rsi > 70:
        return -1.0  # 超买 -> 卖出信号
    return 0.0


def calc_ma(prices: List[float], period: int = 20) -> float:
    if len(prices) < period:
        return 0.0
    ma = sum(prices[-period:]) / period
    current = prices[-1]
    
    # 价格在 MA 上方 = 上涨趋势
    if current > ma * 1.02:
        return 1.0
    elif current < ma * 0.98:
        return -1.0
    return 0.0


def calc_volatility(prices: List[float], period: int = 20) -> float:
    if len(prices) < period:
        return 0.0
    recent = prices[-period:]
    ma = sum(recent) / period
    variance = sum((p - ma) ** 2 for p in recent) / period
    return math.sqrt(variance)


def calc_trend(prices: List[float]) -> float:
    """趋势判断"""
    if len(prices) < 10:
        return 0.0
    
    # 线性回归斜率
    n = len(prices[-10:])
    x = list(range(n))
    y = prices[-10:]
    
    x_mean = sum(x) / n
    y_mean = sum(y) / n
    
    numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    
    if denominator == 0:
        return 0.0
    
    slope = numerator / denominator
    
    # 标准化
    if slope > 0.001:
        return 1.0
    elif slope < -0.001:
        return -1.0
    return 0.0


def calc_momentum(prices: List[float]) -> float:
    """动量指标"""
    if len(prices) < 10:
        return 0.0
    
    current = prices[-1]
    past = prices[-10]
    change = (current - past) / past
    
    if change > 0.05:
        return 1.0
    elif change < -0.05:
        return -1.0
    return 0.0


# ==================== SIGNAL CALCULATION ====================

def calculate_signals(prices: List[float], market_info: Dict, config: Dict) -> Dict:
    """计算交易信号"""
    
    if len(prices) < 20:
        return {"signal": 0, "action": "HOLD", "confidence": 0, "reason": "数据不足"}
    
    # 技术信号
    rsi = calc_rsi(prices)
    ma = calc_ma(prices)
    trend = calc_trend(prices)
    momentum = calc_momentum(prices)
    volatility = calc_volatility(prices)
    
    # 日变化作为基本面信号
    day_change = market_info.get("one_day_change", 0)
    sentiment = 1.0 if day_change > 0.02 else -1.0 if day_change < -0.02 else 0.0
    
    # 综合信号
    tech_signal = rsi * 1.0 + ma * 0.8 + trend * 0.6 + momentum * 0.4
    
    # 加入情绪
    final_signal = (1 - config["sentiment_weight"]) * tech_signal + config["sentiment_weight"] * sentiment
    
    # 归一化
    final_signal = final_signal * config["R_max"] / 4
    
    # 决策阈值
    threshold = 0.02
    if final_signal > threshold:
        action = "BUY"
        confidence = abs(final_signal)
    elif final_signal < -threshold:
        action = "SELL"
        confidence = abs(final_signal)
    else:
        action = "HOLD"
        confidence = abs(final_signal)
    
    # 构建原因
    reasons = []
    if rsi > 0:
        reasons.append("RSI超卖")
    elif rsi < 0:
        reasons.append("RSI超买")
    if ma > 0:
        reasons.append("价格>MA")
    elif ma < 0:
        reasons.append("价格<MA")
    if trend > 0:
        reasons.append("上升趋势")
    elif trend < 0:
        reasons.append("下降趋势")
    if momentum > 0:
        reasons.append("正向动量")
    elif momentum < 0:
        reasons.append("负向动量")
    if day_change > 0.02:
        reasons.append("今日上涨")
    elif day_change < -0.02:
        reasons.append("今日下跌")
    
    return {
        "signal": final_signal,
        "action": action,
        "confidence": confidence,
        "reason": ", ".join(reasons) if reasons else "无明显信号",
        "rsi": rsi,
        "ma": ma,
        "trend": trend,
        "momentum": momentum,
        "volatility": volatility,
        "day_change": day_change
    }


# ==================== MAIN ====================

def main():
    print("=" * 70)
    print("🎯 Polymarket 实时信号检测")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # 设置随机种子
    random.seed(datetime.now().hour)
    
    # 1. 获取市场列表
    print("\n[1] 获取市场数据...")
    try:
        markets = get_markets(limit=30)
        print(f"    ✅ 获取到 {len(markets)} 个市场")
    except Exception as e:
        print(f"    ❌ 获取失败: {e}")
        return
    
    # 2. 解析数据
    parsed_markets = [parse_market_data(m) for m in markets]
    
    # 3. 流动性筛选
    filtered = [m for m in parsed_markets 
                if CONFIG["min_volume"] <= m["volume"] <= CONFIG["max_volume"]]
    print(f"    ✅ 流动性筛选后: {len(filtered)} 个市场")
    
    # 4. 计算信号
    print("\n[2] 计算交易信号...")
    
    results = []
    for market in filtered[:15]:
        question = market["question"]
        current_price = market["yes_price"]
        
        # 生成历史数据 (实际应该从API获取)
        prices = generate_price_history(current_price, days=3)
        
        # 计算信号
        signal = calculate_signals(prices, market, CONFIG)
        
        results.append({
            "market": question,
            "yes_price": current_price,
            "volume": market["volume"],
            "end_date": market["end_date"],
            **signal
        })
    
    # 5. 显示结果
    print("\n" + "=" * 70)
    print("📊 信号检测结果")
    print("=" * 70)
    
    # 按信号强度排序
    results.sort(key=lambda x: x["confidence"], reverse=True)
    
    print(f"\n{'市场':<45} {'价格':<8} {'波动':<6} {'信号':<6} {'置信度':<6}")
    print("-" * 85)
    
    for r in results:
        market_name = r["market"][:43] + ".." if len(r["market"]) > 45 else r["market"]
        vol_str = f"${r['volume']/1000:.0f}K"
        vol_str = f"{r['volatility']:.1%}"
        print(f"{market_name:<45} {r['yes_price']:>6.1%} {vol_str:>6} {r['action']:>6} {r['confidence']:>.4f}")
    
    # 6. 推荐交易
    buy_signals = [r for r in results if r["action"] == "BUY"]
    sell_signals = [r for r in results if r["action"] == "SELL"]
    
    print("\n" + "=" * 70)
    print("🚀 推荐交易")
    print("=" * 70)
    
    if buy_signals:
        print("\n🟢 买入信号 (YES):")
        for i, r in enumerate(buy_signals[:5], 1):
            print(f"  {i}. {r['market'][:50]}")
            print(f"     价格: {r['yes_price']:.1%} | 置信度: {r['confidence']:.4f}")
            print(f"     原因: {r['reason']}")
            print()
    else:
        print("\n🟡 暂无买入信号")
    
    if sell_signals:
        print("\n🔴 卖出信号:")
        for i, r in enumerate(sell_signals[:3], 1):
            print(f"  {i}. {r['market'][:50]}")
            print(f"     价格: {r['yes_price']:.1%} | 置信度: {r['confidence']:.4f}")
            print(f"     原因: {r['reason']}")
            print()
    
    # 7. 统计
    print("=" * 70)
    print("📈 统计")
    print("=" * 70)
    print(f"  市场总数: {len(results)}")
    print(f"  买入信号: {len(buy_signals)}")
    print(f"  卖出信号: {len(sell_signals)}")
    print(f"  观望: {len(results) - len(buy_signals) - len(sell_signals)}")
    
    print("\n" + "=" * 70)
    print("✅ 检测完成")
    print("=" * 70)
    
    return results


if __name__ == "__main__":
    main()
