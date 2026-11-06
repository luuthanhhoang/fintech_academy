import math


def test_burst_then_block():
    b = TokenBucket(5, 1)
    assert all(b.allow(0.0) for _ in range(5))
    assert b.allow(0.0) is False


def test_refill_over_time():
    b = TokenBucket(5, 2)
    for _ in range(5):
        b.allow(0.0)
    assert b.allow(0.4) is False
    assert b.allow(0.5) is True


def test_never_exceeds_capacity():
    b = TokenBucket(3, 10)
    b.allow(0.0)
    assert sum(1 for _ in range(10) if b.allow(100.0)) == 3


def test_retry_after():
    b = TokenBucket(2, 4)
    b.allow(0.0)
    b.allow(0.0)
    assert abs(b.retry_after(0.0) - 0.25) < 1e-9
    assert b.retry_after(1.0) == 0.0


def test_denied_request_does_not_consume():
    b = TokenBucket(1, 1)
    assert b.allow(0.0)
    assert b.allow(0.2) is False
    assert b.allow(1.0) is True


def test_invalid_config_and_oversized_cost():
    try:
        TokenBucket(0, 1)
        assert False, "phải raise ValueError"
    except ValueError:
        pass
    b = TokenBucket(2, 1)
    assert b.allow(0.0, cost=3) is False
    assert math.isinf(b.retry_after(0.0, cost=3))
