import math


def _check(pnl, level=0.5):
    if not pnl:
        raise ValueError("pnl rỗng")
    if not 0 < level < 1:
        raise ValueError("level phải trong (0, 1)")


def _worst_losses(pnl, level):
    _check(pnl, level)
    losses = sorted((-x for x in pnl), reverse=True)
    k = max(1, math.ceil(len(pnl) * (1 - level) - 1e-9))
    return losses, k


def historical_var(pnl, level):
    losses, k = _worst_losses(pnl, level)
    return losses[k - 1]


def expected_shortfall(pnl, level):
    losses, k = _worst_losses(pnl, level)
    return sum(losses[:k]) / k


def parametric_var(pnl, z):
    _check(pnl)
    n = len(pnl)
    if n < 2:
        raise ValueError("cần ít nhất 2 điểm")
    mean = sum(pnl) / n
    s = math.sqrt(sum((x - mean) ** 2 for x in pnl) / (n - 1))
    return z * s - mean


def count_breaches(pnl, var_value):
    return sum(1 for x in pnl if -x > var_value)
