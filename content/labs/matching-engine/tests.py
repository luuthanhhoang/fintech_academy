def _book():
    b = OrderBook()
    b.submit("s1", "sell", 5, 101)
    b.submit("s2", "sell", 5, 101)
    b.submit("s3", "sell", 10, 102)
    b.submit("b1", "buy", 10, 99)
    return b


def test_gia_tot_nhat():
    b = _book()
    assert b.best_bid() == 99 and b.best_ask() == 101


def test_uu_tien_gia_roi_thoi_gian():
    b = _book()
    trades = b.submit("t", "buy", 7, 102)
    assert trades == [("t", "s1", 101, 5), ("t", "s2", 101, 2)], trades


def test_phan_du_lenh_gioi_han_nam_lai():
    b = _book()
    b.submit("t", "buy", 12, 101)
    assert b.best_bid() == 101, "Phần dư 2 cp phải nằm ở giá 101"
    assert b.best_ask() == 102


def test_lenh_thi_truong_quet_so_va_huy_phan_du():
    b = _book()
    trades = b.submit("m", "buy", 25)
    assert sum(t[3] for t in trades) == 20
    assert b.best_ask() is None
    assert b.best_bid() == 99, "Lệnh thị trường không được nằm lại trong sổ"


def test_huy_lenh():
    b = _book()
    assert b.cancel("b1") is True
    assert b.best_bid() is None
    assert b.cancel("khong-co") is False


def test_kiem_tra_dau_vao():
    b = OrderBook()
    for args in [("x", "buy", 0, 10), ("x", "buy", 1.5, 10), ("x", "buy", 1, -1)]:
        try:
            b.submit(*args)
        except ValueError:
            continue
        raise AssertionError(f"Phải từ chối {args}")
