def sma(prices, n, t):
    if t < n - 1 or t >= len(prices):
        raise ValueError("không đủ dữ liệu")
    window = prices[t - n + 1 : t + 1]
    return sum(window) / n


def signals(prices, fast, slow):
    out = []
    for t in range(len(prices)):
        d = t - 1
        if d < slow - 1:
            out.append(0)
        else:
            out.append(1 if sma(prices, fast, d) > sma(prices, slow, d) else 0)
    return out


def backtest(prices, positions, cost_rate):
    wealth = 1.0
    prev = 0
    for t in range(1, len(prices)):
        pos = positions[t]
        r = pos * (prices[t] / prices[t - 1] - 1) - cost_rate * abs(pos - prev)
        wealth *= 1 + r
        prev = pos
    return wealth
