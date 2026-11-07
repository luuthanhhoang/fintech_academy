import json
import math


def grade_json(output, expected_order_id):
    try:
        data = json.loads(output)
    except (ValueError, TypeError):
        data = None
    if not isinstance(data, dict):
        return {"valid_json": False, "has_order_id": False, "short": False}
    summary = data.get("summary")
    return {
        "valid_json": True,
        "has_order_id": data.get("order_id") == expected_order_id,
        "short": isinstance(summary, str) and len(summary.split()) <= 80,
    }


def pass_rate(grades, criterion):
    return sum(1 for g in grades if g[criterion]) / len(grades)


def agreement(judge, human):
    if len(judge) != len(human):
        raise ValueError("độ dài khác nhau")
    return sum(1 for a, b in zip(judge, human) if a == b) / len(judge)


def std_error(p, n):
    return math.sqrt(p * (1 - p) / n)


def gate(baseline, candidate, n, z=2.0):
    blocked = []
    for crit, base in baseline.items():
        if candidate[crit] < base - z * std_error(base, n):
            blocked.append(crit)
    return sorted(blocked)
