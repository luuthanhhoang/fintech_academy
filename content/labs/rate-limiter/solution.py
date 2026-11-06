import math


class TokenBucket:
    def __init__(self, capacity, refill_per_sec):
        if capacity <= 0 or refill_per_sec <= 0:
            raise ValueError("capacity và refill_per_sec phải > 0")
        self.capacity = float(capacity)
        self.rate = float(refill_per_sec)
        self.tokens = float(capacity)
        self.last = None

    def _refill(self, now):
        if self.last is None:
            self.last = now
            return
        elapsed = max(0.0, now - self.last)
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last = now

    def allow(self, now, cost=1):
        self._refill(now)
        if cost > self.capacity:
            return False
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False

    def retry_after(self, now, cost=1):
        self._refill(now)
        if cost > self.capacity:
            return math.inf
        missing = cost - self.tokens
        return 0.0 if missing <= 0 else missing / self.rate
