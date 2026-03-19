#!/usr/bin/env python3
"""
Polymarket 7-Signal Momentum Strategy Simulator
================================================
R(t) = (R_max / 7) · Σ s_i(t)

Signals:
1. RSI Momentum
2. MACD Crossover
3. Bollinger Band Breakout
4. Volume Confirmation
5. Volatility Contraction (ATR)
6. Trend Strength (ADX)
7. Mean Reversion
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import random

# ==================== DATA SIMULATION ====================

def generate_synthetic_price_data(days: int = 90, initial_price: float = 0.5) -> List[Dict]:
    """
    生成模拟的价格数据 (Polymarket 二元期权价格)
    价格范围: 0.01 - 0.99
    """
    data = []
    price = initial_price
    base_time = datetime(2026, 2, 1)
    
    # 添加一些趋势和波动
    trends = [
        (0, 15, 0.002),      # 缓慢上涨
        (15, 30, -0.003),    # 下跌
        (30, 45, 0.004),     # 快速上涨
        (45, 60, -0.001),    # 震荡
        (60, 75, 0.005),     # 暴涨
        (75, 90, -0.002),    # 回撤
    ]
    
    for day in range(days):
        # 找到当前时间段
        trend = 0
        for start, end, t in trends:
            if start <= day < end:
                trend = t
                break
        
        # 添加随机波动
        daily_change = trend + random.uniform(-0.02, 0.02)
        price = max(0.01, min(0.99, price + daily_change))
        
        # 生成日内数据 (开盘、最高、最低、收盘、成交量)
        for hour in range(24):
            timestamp = base_time + timedelta(days=day, hours=hour)
            intra_day_volatility = random.uniform(0.001, 0.01)
            
            open_price = price
            high = min(0.99, price + intra_day_volatility + abs(random.gauss(0, 0.005)))
            low = max(0.01, price - intra_day_volatility - abs(random.gauss(0, 0.005)))
            close = price + random.gauss(0, 0.005)
            close = max(0.01, min(0.99, close))
            
            volume = random.randint(1000, 50000)
            
            data.append({
                "timestamp": timestamp.isoformat(),
                "open": round(open_price, 4),
                "high": round(high, 4),
                "low": round(low, 4),
                "close": round(close, 4),
                "volume": volume
            })
            
            price = close  # 下个小时的开盘价等于前个小时的收盘价
    
    return data


# ==================== TECHNICAL INDICATORS ====================

def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """Signal 1: RSI Momentum"""
    if len(prices) < period + 1:
        return 0.5
    
    gains = []
    losses = []
    
    for i in range(1, period + 1):
        change = prices[-i] - prices[-i-1]
        if change > 0:
            gains.append(change)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(change))
    
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    
    if avg_loss == 0:
        return 100
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    # Signal: RSI < 30 = oversold (buy), RSI > 70 = overbought (sell)
    if rsi < 30:
        return 1.0  # Buy signal
    elif rsi > 70:
        return -1.0  # Sell signal
    else:
        return 0.0  # Neutral


def calculate_macd(prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> float:
    """Signal 2: MACD Crossover"""
    if len(prices) < slow + 1:
        return 0.0
    
    def ema(data, period):
        multiplier = 2 / (period + 1)
        ema_val = data[0]
        for price in data[1:]:
            ema_val = (price * multiplier) + (ema_val * (1 - multiplier))
        return ema_val
    
    # Calculate EMAs
    fast_ema = ema(prices[-slow:], fast)
    slow_ema = ema(prices[-slow:], slow)
    macd_line = fast_ema - slow_ema
    
    # Signal line is EMA of MACD
    macd_values = []
    for i in range(slow, len(prices)):
        f_ema = ema(prices[:i+1], fast)
        s_ema = ema(prices[:i+1], slow)
        macd_values.append(f_ema - s_ema)
    
    if len(macd_values) < signal:
        return 0.0
    
    signal_line = ema(macd_values[-signal:], signal)
    
    # Crossover detection
    if macd_line > signal_line and macd_values[-2] <= ema(macd_values[:-1], signal) if len(macd_values) > signal else False:
        return 1.0  # Bullish crossover
    elif macd_line < signal_line and macd_values[-2] >= ema(macd_values[:-1], signal) if len(macd_values) > signal else False:
        return -1.0  # Bearish crossover
    else:
        # Use MACD histogram
        if macd_line > signal_line:
            return 0.5
        elif macd_line < signal_line:
            return -0.5
        return 0.0


def calculate_bollinger(prices: List[float], period: int = 20, std_dev: int = 2) -> float:
    """Signal 3: Bollinger Band Breakout"""
    if len(prices) < period:
        return 0.0
    
    recent_prices = prices[-period:]
    sma = sum(recent_prices) / period
    variance = sum((p - sma) ** 2 for p in recent_prices) / period
    std = variance ** 0.5
    
    upper_band = sma + (std_dev * std)
    lower_band = sma - (std_dev * std)
    
    current_price = prices[-1]
    
    if current_price > upper_band:
        return 1.0  # Breakout above
    elif current_price < lower_band:
        return -1.0  # Breakout below
    else:
        return 0.0  # Within bands


def calculate_volume_confirmation(prices: List[float], volumes: List[int]) -> float:
    """Signal 4: Volume Confirmation"""
    if len(volumes) < 20:
        return 0.0
    
    avg_volume = sum(volumes[-20:]) / 20
    current_volume = volumes[-1]
    
    # Price change
    price_change = prices[-1] - prices[-2]
    
    # Volume surge with price move = confirmation
    if current_volume > avg_volume * 1.5:
        if price_change > 0:
            return 1.0
        elif price_change < 0:
            return -1.0
    
    return 0.0


def calculate_atr(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> float:
    """Signal 5: Volatility Contraction (Low ATR = potential breakout)"""
    if len(highs) < period + 1:
        return 0.0
    
    tr_values = []
    for i in range(1, period + 1):
        high = highs[-i]
        low = lows[-i]
        prev_close = closes[-i-1]
        
        tr = max(
            high - low,
            abs(high - prev_close),
            abs(low - prev_close)
        )
        tr_values.append(tr)
    
    atr = sum(tr_values) / period
    
    # Compare to historical ATR
    historical_atr = []
    for j in range(period, len(highs) - period):
        tr_sum = 0
        for k in range(j - period, j):
            h = highs[k]
            l = lows[k]
            pc = closes[k-1] if k > 0 else closes[0]
            tr_sum += max(h - l, abs(h - pc), abs(l - pc))
        historical_atr.append(tr_sum / period)
    
    if not historical_atr:
        return 0.0
    
    avg_historical_atr = sum(historical_atr) / len(historical_atr)
    
    # Low ATR = contraction = potential explosion
    if atr < avg_historical_atr * 0.7:
        return 1.0  # Contraction - prepare for move
    elif atr > avg_historical_atr * 1.3:
        return -1.0  # Expansion - may mean trend ending
    else:
        return 0.0


def calculate_adx(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> float:
    """Signal 6: Trend Strength (ADX)"""
    if len(highs) < period + 1:
        return 0.0
    
    # Calculate +DI and -DI
    plus_dm = []
    minus_dm = []
    tr_values = []
    
    for i in range(1, period + 1):
        high = highs[-i]
        low = lows[-i]
        prev_high = highs[-i-1]
        prev_low = lows[-i-1]
        prev_close = closes[-i-1]
        
        plus_dm_val = high - prev_high if high - prev_high > prev_low - low else 0
        minus_dm_val = prev_low - low if prev_low - low > high - prev_high else 0
        
        plus_dm.append(plus_dm_val)
        minus_dm.append(minus_dm_val)
        
        tr = max(
            high - low,
            abs(high - prev_close),
            abs(low - prev_close)
        )
        tr_values.append(tr)
    
    plus_di = (sum(plus_dm) / period) / (sum(tr_values) / period) * 100
    minus_di = (sum(minus_dm) / period) / (sum(tr_values) / period) * 100
    
    dx = abs(plus_di - minus_di) / (plus_di + minus_di) * 100
    adx = dx  # Simplified ADX
    
    if adx > 25:
        # Strong trend - follow direction
        if plus_di > minus_di:
            return 1.0
        else:
            return -1.0
    else:
        return 0.0  # Weak trend - no signal


def calculate_mean_reversion(prices: List[float], period: int = 20) -> float:
    """Signal 7: Mean Reversion"""
    if len(prices) < period:
        return 0.0
    
    sma = sum(prices[-period:]) / period
    current_price = prices[-1]
    
    deviation = (current_price - sma) / sma
    
    # If price deviates significantly from mean, expect reversion
    if deviation > 0.15:
        return -1.0  # Price too high, expect down
    elif deviation < -0.15:
        return 1.0  # Price too low, expect up
    else:
        return 0.0  # Near mean


# ==================== SIGNAL GENERATION ====================

def calculate_all_signals(data: List[Dict]) -> Dict:
    """Calculate all 7 signals for current moment"""
    
    closes = [d["close"] for d in data]
    highs = [d["high"] for d in data]
    lows = [d["low"] for d in data]
    volumes = [d["volume"] for d in data]
    
    signals = {
        "rsi": calculate_rsi(closes),
        "macd": calculate_macd(closes),
        "bollinger": calculate_bollinger(closes),
        "volume": calculate_volume_confirmation(closes, volumes),
        "atr": calculate_atr(highs, lows, closes),
        "adx": calculate_adx(highs, lows, closes),
        "mean_reversion": calculate_mean_reversion(closes)
    }
    
    return signals


def calculate_composite_signal(signals: Dict, R_max: float = 0.5) -> Tuple[float, str, float]:
    """
    R(t) = (R_max / 7) · Σ s_i(t)
    Returns: (signal_strength, action, confidence)
    """
    signal_values = list(signals.values())
    raw_sum = sum(signal_values)
    
    # Normalize to -1 to +1
    normalized_signal = (R_max / 7) * raw_sum
    
    # Determine action
    if normalized_signal > R_max * 0.5:
        action = "BUY"
    elif normalized_signal < -R_max * 0.5:
        action = "SELL"
    else:
        action = "HOLD"
    
    # Confidence based on signal alignment
    non_zero_signals = [s for s in signal_values if s != 0]
    if non_zero_signals:
        alignment = len(non_zero_signals) / 7
        confidence = abs(normalized_signal) * alignment
    else:
        confidence = 0
    
    return normalized_signal, action, confidence


# ==================== BACKTEST ENGINE ====================

def run_backtest(data: List[Dict], R_max: float = 0.5, initial_capital: float = 1000) -> Dict:
    """
    Run backtest on historical data
    """
    capital = initial_capital
    position = 0  # Number of shares
    position_price = 0
    trades = []
    equity_curve = []
    
    # Need at least 50 data points for indicators
    warmup = 50
    
    for i in range(warmup, len(data)):
        current_data = data[:i+1]
        
        # Calculate signals
        signals = calculate_all_signals(current_data)
        signal_strength, action, confidence = calculate_composite_signal(signals, R_max)
        
        current_price = data[i]["close"]
        
        # Trading logic
        if action == "BUY" and position == 0 and confidence > 0.2:
            # Buy
            shares_to_buy = (capital * R_max) / current_price
            cost = shares_to_buy * current_price
            if cost < capital:
                position = shares_to_buy
                position_price = current_price
                capital -= cost
                trades.append({
                    "time": data[i]["timestamp"],
                    "action": "BUY",
                    "price": current_price,
                    "shares": shares_to_buy,
                    "confidence": confidence
                })
        
        elif action == "SELL" and position > 0:
            # Sell
            proceeds = position * current_price
            capital += proceeds
            trades.append({
                "time": data[i]["timestamp"],
                "action": "SELL",
                "price": current_price,
                "shares": position,
                "profit": proceeds - (position * position_price),
                "confidence": confidence
            })
            position = 0
            position_price = 0
        
        # Track equity
        total_equity = capital + (position * current_price) if position > 0 else capital
        equity_curve.append({
            "time": data[i]["timestamp"],
            "equity": total_equity
        })
    
    # Close any remaining position
    if position > 0:
        final_price = data[-1]["close"]
        capital += position * final_price
    
    total_return = ((capital - initial_capital) / initial_capital) * 100
    
    return {
        "initial_capital": initial_capital,
        "final_capital": capital,
        "total_return": total_return,
        "num_trades": len(trades),
        "trades": trades,
        "equity_curve": equity_curve
    }


# ==================== MAIN ====================

if __name__ == "__main__":
    print("=" * 60)
    print("Polymarket 7-Signal Momentum Strategy - Backtest")
    print("=" * 60)
    
    # Generate synthetic data
    print("\n[1] Generating 90 days of synthetic price data...")
    data = generate_synthetic_price_data(days=90, initial_price=0.5)
    print(f"    Generated {len(data)} hourly data points")
    
    # Show sample data
    print("\n[2] Sample data points:")
    for i in [0, len(data)//2, len(data)-1]:
        print(f"    {data[i]['timestamp']}: O={data[i]['open']:.4f} H={data[i]['high']:.4f} L={data[i]['low']:.4f} C={data[i]['close']:.4f}")
    
    # Run backtest
    print("\n[3] Running backtest...")
    print(f"    R_max (max risk): 50%")
    print(f"    Initial capital: $1000")
    
    results = run_backtest(data, R_max=0.5, initial_capital=1000)
    
    print("\n" + "=" * 60)
    print("BACKTEST RESULTS")
    print("=" * 60)
    print(f"Initial Capital:    ${results['initial_capital']:.2f}")
    print(f"Final Capital:       ${results['final_capital']:.2f}")
    print(f"Total Return:       {results['total_return']:.2f}%")
    print(f"Number of Trades:   {results['num_trades']}")
    
    print("\n[4] Trade History:")
    for i, trade in enumerate(results['trades'][:10]):  # Show first 10 trades
        print(f"    {i+1}. {trade['action']:4s} @ ${trade['price']:.4f} | Conf: {trade.get('confidence', 0):.2f}")
        if 'profit' in trade:
            print(f"       → Profit: ${trade['profit']:.2f}")
    
    if len(results['trades']) > 10:
        print(f"    ... and {len(results['trades']) - 10} more trades")
    
    # Show signal breakdown for last data point
    print("\n[5] Current Signal Breakdown (latest data point):")
    signals = calculate_all_signals(data)
    for name, value in signals.items():
        signal_name = {
            "rsi": "RSI Momentum",
            "macd": "MACD Crossover", 
            "bollinger": "Bollinger Bands",
            "volume": "Volume Confirmation",
            "atr": "ATR Contraction",
            "adx": "ADX Trend Strength",
            "mean_reversion": "Mean Reversion"
        }.get(name, name)
        
        if value > 0:
            direction = "🟢 BUY"
        elif value < 0:
            direction = "🔴 SELL"
        else:
            direction = "⚪ HOLD"
        
        print(f"    {signal_name:20s}: {value:+.1f} → {direction}")
    
    signal_strength, action, confidence = calculate_composite_signal(signals, R_max=0.5)
    print(f"\n[6] Composite Signal:")
    print(f"    R(t) = (0.5/7) × Σ signals = {signal_strength:.4f}")
    print(f"    Action: {action}")
    print(f"    Confidence: {confidence:.2f}")
    
    print("\n" + "=" * 60)
    print("Simulation complete. Ready for real API connection.")
    print("=" * 60)
