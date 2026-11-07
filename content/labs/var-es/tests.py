def _close(a, b, tol=1e-9):
    return abs(a - b) <= tol


def _sample():
    # 100 ngày: lỗ 1..10 ở 10 ngày đầu, còn lại lãi 1
    return [-float(i) for i in range(10, 0, -1)] + [1.0] * 90


def test_var_lich_su():
    assert _close(historical_var(_sample(), 0.95), 6.0), "k = ceil(100 × 0,05) = 5 → lỗ lớn thứ 5 là 6"


def test_es_lon_hon_hoac_bang_var():
    pnl = _sample()
    assert _close(expected_shortfall(pnl, 0.95), (10 + 9 + 8 + 7 + 6) / 5)
    assert expected_shortfall(pnl, 0.95) >= historical_var(pnl, 0.95)


def test_var_99():
    assert _close(historical_var(_sample(), 0.99), 10.0)


def test_var_tham_so():
    pnl = [1.0, -1.0, 1.0, -1.0]
    # mean 0, s = sqrt(4/3)
    assert _close(parametric_var(pnl, 2.326), 2.326 * (4 / 3) ** 0.5)


def test_dem_vuot_var():
    assert count_breaches(_sample(), 6.0) == 4


def test_loi_dau_vao():
    for bad in ([], 0.0, 1.0):
        try:
            if bad == []:
                historical_var([], 0.99)
            else:
                historical_var([1.0, -1.0], bad)
        except ValueError:
            continue
        raise AssertionError("Phải raise ValueError")
