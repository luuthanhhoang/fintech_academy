def _close(a, b, tol=1e-9):
    return abs(a - b) <= tol


def test_sma():
    assert _close(sma([1, 2, 3, 4], 2, 3), 3.5)
    try:
        sma([1, 2, 3], 3, 1)
    except ValueError:
        pass
    else:
        raise AssertionError("Phải raise ValueError khi chưa đủ dữ liệu")


def test_khong_nhin_truoc():
    # Giá nhảy vọt đúng ngày 5. Tín hiệu cho ngày 5 không được biết trước cú nhảy.
    prices = [10, 10, 10, 10, 10, 20, 20, 20]
    pos = signals(prices, 1, 3)
    assert pos[5] == 0, "Vị thế ngày 5 chỉ dùng dữ liệu đến ngày 4 — chưa thấy cú nhảy"
    assert pos[6] == 1


def test_khong_doc_gia_hom_nay():
    prices = [10, 11, 12, 13, 14, 15]
    a = signals(prices, 1, 2)
    b = signals(prices[:-1] + [1], 1, 2)
    assert a == b, "Đổi giá ngày cuối không được làm đổi tín hiệu của chính ngày đó"


def test_backtest_chi_phi():
    prices = [100, 110, 121]
    w = backtest(prices, [0, 1, 1], 0.01)
    assert _close(w, (1 + 0.10 - 0.01) * (1 + 0.10))


def test_chi_phi_lam_giam_ket_qua():
    prices = [100, 101, 100, 101, 100, 101]
    pos = [0, 1, 0, 1, 0, 1]
    assert backtest(prices, pos, 0.0) > backtest(prices, pos, 0.005)
