#!/usr/bin/env python3
"""
Polymarket 7-Signal Strategy - 原始公式版
=========================================
R(t) = R_max · m(t) = (R_max / 7) · Σ s_i(t)

每个信号 s_i(t) ∈ {-1, 0, +1}
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

random.seed(42)

# ==================== 配置 ====================

class Config:
    R_max = 0.20     # 最大风险敞口 (最优配置)
    stop_loss = 0.03  # 止损 3%
    take_profit = 0.06 # 止盈 6%
    threshold = 0.25   # 信号阈值
    sentiment_weight = 0.3  # 情绪权重


# ==================== 市场数据 ====================

MARKETS = {
    "bitboy": {
        "question": "BitBoy convicted?",
        "price": 0.224,
        "volatility": 0.40,
        "sentiment": -0.3,
    },
    "russia_ukraine": {
        "question": "Russia-Ukraine Ceasefire before GTA VI?",
        "price": 0.535,
        "volatility": 0.04,
        "sentiment": 0.1,
    },
    "fed": {
        "question": "Fed cuts rates March 2026?",
        "price": 0.35,
        "volatility": 0.25,
        "sentiment": 0.2,
    },
}


# ==================== 价格生成 ====================

def gen_prices(init_price: float, vol: float, days: int = 90) -> List[Dict]:
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
            hp = max(op, cp) * (1 + abs(n/2))
            lp = min(op, cp) * (1 - abs(n/2))
            
            data.append({
                "ts": t.isoformat(),
                "o": round(op, 4),
                "h": round(hp, 4),
                "l": round(lp, 4),
                "c": round(cp, 4),
                "v": int(random.uniform(5000, 50000))
            })
            p = cp
    return data


# ==================== 7 个技术指标 (输出 -1, 0, +1) ====================

def s_rsi(prices: List[float]) -> int:
    """s1: RSI 超买超卖"""
    if len(prices) < 15:
        return 0
    gains = [max(0, prices[i]-prices[i-1]) for i in range(1, 15)]
    losses = [max(0, prices[i-1]-prices[i]) for i in range(1, 15)]
    avg_g = sum(gains) / 14
    avg_l = sum(losses) / 14
    if avg_l == 0:
        return 1 if avg_g > 0 else 0
    rsi = 100 - (100 / (1 + avg_g/avg_l))
    return 1 if rsi < 30 else -1 if rsi > 70 else 0


def s_macd(prices: List[float]) -> int:
    """s2: MACD 交叉"""
    if len(prices) < 26:
        return 0
    # 简化 EMA
    def ema(d, p):
        k = 2/(p+1)
        e = d[0]
        for v in d[1:]:
            e = v*k + e*(1-k)
        return e
    e12 = ema(prices, 12)
    e26 = ema(prices, 26)
    macd = e12 - e26
    # 信号线
    ms = [ema(prices[:i+1], 12) - ema(prices[:i+1], 26) for i in range(26, len(prices))]
    if len(ms) < 9:
        return 0
    sig = ema(ms[-9:], 9)
    return 1 if macd > sig else -1 if macd < sig else 0


def s_bollinger(prices: List[float]) -> int:
    """s3: 布林带突破"""
    if len(prices) < 20:
        return 0
    recent = prices[-20:]
    sma = sum(recent) / 20
    std = (sum((x-sma)**2 for x in recent) / 20) ** 0.5
    cur = prices[-1]
    return 1 if cur > sma + 2*std else -1 if cur < sma - 2*std else 0


def s_volume(vols: List[int]) -> int:
    """s4: 成交量确认"""
    if len(vols) < 20:
        return 0
    avg = sum(vols[-20:]) / 20
    return 1 if vols[-1] > avg*1.5 else -1 if vols[-1] < avg*0.5 else 0


def s_atr(h, l, c) -> int:
    """s5: ATR 波动率收缩"""
    if len(h) < 15:
        return 0
    tr = [max(h[i]-l[i], abs(h[i]-c[i-1]), abs(l[i]-c[i-1])) for i in range(1, 15)]
    atr = sum(tr) / 14
    # 历史 ATR 比较
    hist = [sum([max(h[j]-l[j], abs(h[j]-c[j-1]), abs(l[j]-c[j-1])) for j in range(i-14, i)])/14 
            for i in range(15, len(h)-14)]
    if not hist:
        return 0
    avg_hist = sum(hist) / len(hist)
    return 1 if atr < avg_hist*0.7 else -1 if atr > avg_hist*1.3 else 0


def s_adx(h, l, c) -> int:
    """s6: ADX 趋势强度"""
    if len(h) < 15:
        return 0
    pdm = [max(0, h[i]-h[i-1]) if h[i]-h[i-1] > l[i-1]-l[i] else 0 for i in range(1, 15)]
    mdm = [max(0, l[i-1]-l[i]) if l[i-1]-l[i] > h[i]-h[i-1] else 0 for i in range(1, 15)]
    tr = [max(h[i]-l[i], abs(h[i]-c[i-1]), abs(l[i]-c[i-1])) for i in range(1, 15)]
    plus = (sum(pdm)/14) / (sum(tr)/14) * 100
    minus = (sum(mdm)/14) / (sum(tr)/14) * 100
    dx = abs(plus-minus)/(plus+minus)*100 if (plus+minus) > 0 else 0
    if dx > 25:
        return 1 if plus > minus else -1
    return 0


def s_mean_reversion(prices: List[float]) -> int:
    """s7: 均值回归"""
    if len(prices) < 20:
        return 0
    sma = sum(prices[-20:]) / 20
    dev = (prices[-1] - sma) / sma
    return 1 if dev < -0.15 else -1 if dev > 0.15 else 0


# ==================== 核心公式 ====================

def calc_signals(data: List[Dict]) -> Dict:
    """计算 7 个信号"""
    c = [d["c"] for d in data]
    h = [d["h"] for d in data]
    l = [d["l"] for d in data]
    v = [d["v"] for d in data]
    
    return {
        "s1_rsi": s_rsi(c),
        "s2_macd": s_macd(c),
        "s3_bands": s_bollinger(c),
        "s4_volume": s_volume(v),
        "s5_atr": s_atr(h, l, c),
        "s6_adx": s_adx(h, l, c),
        "s7_mean": s_mean_reversion(c)
    }


def R_formula(signals: Dict, sentiment: float, config: Config) -> Tuple[float, str, float]:
    """
    核心公式: R(t) = (R_max / 7) · Σ s_i(t)
    
    加入情绪: R_final = (1-w)·R_tech + w·R_sent
    """
    # 技术信号求和 (每个是 -1, 0, +1)
    s_sum = sum(signals.values())
    
    # R_技术 = (R_max / 7) * Σ s_i
    R_tech = (config.R_max / 7) * s_sum
    
    # R_情绪 = sentiment * R_max
    R_sent = sentiment * config.R_max
    
    # 组合
    w = config.sentiment_weight
    R_final = (1 - w) * R_tech + w * R_sent
    
    # 决策
    if R_final > config.R_max * 0.3:
        action = "BUY"
    elif R_final < -config.R_max * 0.3:
        action = "SELL"
    else:
        action = "HOLD"
    
    # 置信度: 信号对齐数量
    align_count = len([x for x in signals.values() if x != 0])
    confidence = abs(R_final) * (align_count / 7)
    
    return R_final, action, confidence


# ==================== 回测 ====================

def backtest(market: Dict, config: Config, days: int = 90) -> Dict:
    prices = gen_prices(market["price"], market["volatility"], days)
    
    capital = 1000
    position = 0
    entry = 0
    trades = []
    
    for i in range(50, len(prices)):
        data = prices[:i+1]
        signals = calc_signals(data)
        R_t, action, conf = R_formula(signals, market.get("sentiment", 0), config)
        
        cur = prices[i]["c"]
        
        # 止损止盈
        if position > 0:
            pnl = (cur - entry) / entry
            if pnl <= -config.stop_loss:
                capital += position * cur
                trades.append({"a": "STOP_LOSS", "p": cur, "pnl": position*(cur-entry)})
                position = 0
                continue
            elif pnl >= config.take_profit:
                capital += position * cur
                trades.append({"a": "TAKE_PROFIT", "p": cur, "pnl": position*(cur-entry)})
                position = 0
                continue
        
        # 交易
        if action == "BUY" and position == 0 and conf > config.min_confidence:
            shares = (capital * config.R_max) / cur
            cost = shares * cur
            if cost < capital:
                position = shares
                entry = cur
                capital -= cost
                trades.append({"a": "BUY", "p": cur, "s": signals})
        
        elif action == "SELL" and position > 0:
            capital += position * cur
            trades.append({"a": "SELL", "p": cur, "pnl": position*(cur-entry)})
            position = 0
    
    if position > 0:
        capital += position * prices[-1]["c"]
    
    return {
        "initial": 1000,
        "final": capital,
        "return": (capital - 1000) / 10,
        "trades": len(trades),
        "details": trades
    }


# ==================== 主程序 ====================

if __name__ == "__main__":
    print("=" * 70)
    print("原始公式测试: R(t) = (R_max / 7) · Σ s_i(t)")
    print("=" * 70)
    
    # 显示公式
    print("\n【核心公式】")
    print("R(t) = (R_max / 7) · Σ s_i(t)")
    print("其中 s_i(t) ∈ {-1, 0, +1}")
    print()
    
    config = Config()
    
    # 测试不同 R_max
    print("【R_max 参数测试】")
    print("-" * 50)
    
    for r_max in [0.3, 0.5, 0.7, 0.9]:
        config.R_max = r_max
        result = backtest(MARKETS["fed"], config)
        print(f"R_max={r_max} → 收益: {result['return']:+.2f}% | 交易: {result['trades']}")
    
    # 全部市场测试
    print("\n【所有市场测试】(R_max=0.5)")
    print("-" * 50)
    config.R_max = 0.5
    
    results = []
    for name, m in MARKETS.items():
        r = backtest(m, config)
        results.append((m["question"][:35], r["return"], r["trades"]))
        print(f"{m['question'][:40]:40s} | 收益: {r['return']:+6.2f}% | 交易: {r['trades']}")
    
    # 当前信号展示
    print("\n【当前信号分解】(Fed 市场)")
    print("-" * 50)
    
    # 生成最新数据
    data = gen_prices(MARKETS["fed"]["price"], MARKETS["fed"]["volatility"], 90)
    signals = calc_signals(data)
    
    s_sum = sum(signals.values())
    R_tech = (0.5 / 7) * s_sum
    
    print(f"\n7 个信号值 (s_i):")
    for name, val in signals.items():
        sign = "🟢 +1" if val == 1 else "🔴 -1" if val == -1 else "⚪  0"
        print(f"  {name:12s}: {val:+2d}  {sign}")
    
    print(f"\n信号求和: Σ s_i = {s_sum:+2d}")
    print(f"R_技术 = (0.5 / 7) × {s_sum:+2d} = {R_tech:.4f}")
    
    # 加入情绪
    sent = MARKETS["fed"]["sentiment"]
    R_sent = sent * 0.5
    R_final = 0.7 * R_tech + 0.3 * R_sent
    
    print(f"\n情绪信号: {sent:+.1f}")
    print(f"R_情绪 = {sent:.1f} × 0.5 = {R_sent:.4f}")
    print(f"\nR_最终 = 0.7 × {R_tech:.4f} + 0.3 × {R_sent:.4f}")
    print(f"       = {R_final:.4f}")
    
    if R_final > 0.15:
        print(f"\n➡️  建议: BUY")
    elif R_final < -0.15:
        print(f"\n➡️  建议: SELL")
    else:
        print(f"\n➡️  建议: HOLD")
    
    print("\n" + "=" * 70)
    print("✅ 测试完成!")
    print("=" * 70)
