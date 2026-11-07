def test_tai_lap_theo_seed():
    a = simulate_final(7, 200, 12, 0.005, 0.04)
    b = simulate_final(7, 200, 12, 0.005, 0.04)
    assert a == b, "Cùng seed phải cho cùng kết quả"
    assert a != simulate_final(8, 200, 12, 0.005, 0.04)


def test_khong_bien_dong():
    vals = simulate_final(1, 5, 12, 0.01, 0.0)
    assert all(abs(v - 1.01 ** 12) < 1e-12 for v in vals)


def test_xac_suat_va_sai_so():
    vals = [0.7, 0.85, 0.9, 1.1, 1.2]
    p = prob_below(vals, 0.8)
    assert abs(p - 0.2) < 1e-12
    assert abs(std_error(0.2, 400) - 0.02) < 1e-12


def test_sai_so_giam_theo_can_bac_hai():
    assert abs(std_error(0.1, 100) / std_error(0.1, 400) - 2.0) < 1e-12


def test_phan_vi():
    assert percentile([5, 1, 3, 2, 4], 0.5) == 3
    assert percentile([5, 1, 3, 2, 4], 0.0) == 1


def test_mo_phong_hop_ly():
    vals = simulate_final(42, 2000, 12, 0.0, 0.05)
    p = prob_below(vals, 0.8)
    assert 0.0 < p < 0.3, "Với độ biến động tháng 5%, lỗ trên 20% sau 12 tháng không quá phổ biến"
