class _Clock:
    def __init__(self):
        self.t = 0

    def __call__(self):
        return self.t


def test_hit_miss():
    c = LRUCache(2, 60, _Clock())
    assert c.get("a") is None
    c.set("a", 1)
    assert c.get("a") == 1
    assert (c.hits, c.misses) == (1, 1)


def test_ttl():
    clk = _Clock()
    c = LRUCache(2, 60, clk)
    c.set("a", 1)
    clk.t = 59
    assert c.get("a") == 1
    clk.t = 60
    assert c.get("a") is None, "Hết hạn khi now − lúc ghi ≥ ttl"


def test_lru_loai_dung_khoa():
    c = LRUCache(2, 100, _Clock())
    c.set("a", 1)
    c.set("b", 2)
    c.get("a")
    c.set("c", 3)
    assert c.get("b") is None, "b ít được dùng gần đây nhất nên bị loại"
    assert c.get("a") == 1 and c.get("c") == 3


def test_cache_aside_goi_nguon_mot_lan():
    calls = []
    c = LRUCache(10, 100, _Clock())
    loader = lambda: calls.append(1) or "gia tri"
    assert c.get_or_load("k", loader) == "gia tri"
    assert c.get_or_load("k", loader) == "gia tri"
    assert len(calls) == 1


def test_ghi_lai_lam_moi_ttl():
    clk = _Clock()
    c = LRUCache(2, 10, clk)
    c.set("a", 1)
    clk.t = 8
    c.set("a", 2)
    clk.t = 15
    assert c.get("a") == 2
