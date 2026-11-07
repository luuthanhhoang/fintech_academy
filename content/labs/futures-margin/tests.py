ALWAYS = lambda t: True


def test_vi_du_bai_hoc():
    r = simulate(50, [48.5, 47, 49], 1000, 1, 5000, 3500, ALWAYS)
    assert r["balances"] == [3500, 5000, 7000], "Ngày 1 bằng ngưỡng không gọi; ngày 2 gọi 3.000"
    assert r["calls"] == [(1, 3000)]
    assert r["total_pnl"] == -1000


def test_ban_khong():
    r = simulate(500, [505, 520, 490], 200, -1, 10000, 7000, ALWAYS)
    assert r["calls"] == [(1, 4000)]
    assert r["balances"][-1] == 16000
    assert r["total_pnl"] == (500 - 490) * 200


def test_dong_vi_the():
    r = simulate(100, [95, 110], 100, 1, 1000, 800, lambda t: False)
    assert r["closed_day"] == 0
    assert len(r["balances"]) == 1, "Dừng ngay ngày bị đóng vị thế"
    assert r["total_pnl"] == -500


def test_tong_lai_lo_khop():
    settles = [101, 99, 104, 103]
    r = simulate(100, settles, 10, 1, 1000, 500, ALWAYS)
    assert r["total_pnl"] == (settles[-1] - 100) * 10
