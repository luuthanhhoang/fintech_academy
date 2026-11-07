import math
import random


def simulate_final(seed, n, months, mu, sigma):
    rng = random.Random(seed)
    out = []
    for _ in range(n):
        v = 1.0
        for _ in range(months):
            v *= 1 + rng.gauss(mu, sigma)
        out.append(v)
    return out


def prob_below(values, threshold):
    return sum(1 for v in values if v < threshold) / len(values)


def std_error(p, n):
    return math.sqrt(p * (1 - p) / n)


def percentile(values, q):
    s = sorted(values)
    return s[int(math.floor(q * (len(s) - 1)))]
