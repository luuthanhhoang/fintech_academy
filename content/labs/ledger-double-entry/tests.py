def _books():
    l = Ledger()
    for name, kind in [("Tiền", "asset"), ("Hàng tồn kho", "asset"), ("Vay ngân hàng", "liability"),
                       ("Vốn góp", "equity"), ("Doanh thu", "revenue"), ("Giá vốn", "expense")]:
        l.open_account(name, kind)
    return l


def test_gop_von_va_vay():
    l = _books()
    l.post("Góp vốn", [("Tiền", 1_000_000, 0), ("Vốn góp", 0, 1_000_000)])
    l.post("Vay", [("Tiền", 500_000, 0), ("Vay ngân hàng", 0, 500_000)])
    assert l.balance("Tiền") == 1_500_000
    assert l.balance("Vốn góp") == 1_000_000
    assert l.balance("Vay ngân hàng") == 500_000


def test_phuong_trinh_ke_toan():
    l = _books()
    l.post("Góp vốn", [("Tiền", 1_000_000, 0), ("Vốn góp", 0, 1_000_000)])
    l.post("Mua hàng", [("Hàng tồn kho", 300_000, 0), ("Tiền", 0, 300_000)])
    l.post("Bán hàng", [("Tiền", 450_000, 0), ("Doanh thu", 0, 450_000)])
    l.post("Kết chuyển giá vốn", [("Giá vốn", 300_000, 0), ("Hàng tồn kho", 0, 300_000)])
    assets = l.balance("Tiền") + l.balance("Hàng tồn kho")
    equity = l.balance("Vốn góp") + l.balance("Doanh thu") - l.balance("Giá vốn")
    assert assets == l.balance("Vay ngân hàng") + equity, "Tài sản phải = Nợ phải trả + Vốn chủ"


def test_tu_choi_but_toan_khong_can():
    l = _books()
    try:
        l.post("Sai", [("Tiền", 100, 0), ("Vốn góp", 0, 99)])
    except ValueError:
        pass
    else:
        raise AssertionError("Phải từ chối bút toán Nợ ≠ Có")
    assert l.entries == []


def test_tu_choi_so_thuc_va_so_am():
    l = _books()
    for bad in ([("Tiền", 10.5, 0), ("Vốn góp", 0, 10.5)], [("Tiền", -5, 0), ("Vốn góp", 0, -5)]):
        try:
            l.post("Sai", bad)
        except ValueError:
            continue
        raise AssertionError(f"Phải từ chối {bad}")


def test_tu_choi_tai_khoan_chua_mo_va_dong_hai_chieu():
    l = _books()
    for bad in ([("Không tồn tại", 10, 0), ("Vốn góp", 0, 10)], [("Tiền", 10, 10), ("Vốn góp", 0, 0)]):
        try:
            l.post("Sai", bad)
        except ValueError:
            continue
        raise AssertionError(f"Phải từ chối {bad}")


def test_bang_can_doi_thu_va_but_toan_dao():
    l = _books()
    i = l.post("Góp vốn", [("Tiền", 200, 0), ("Vốn góp", 0, 200)])
    l.reverse(i)
    dr, cr = l.trial_balance()
    assert dr == cr == 400
    assert l.balance("Tiền") == 0
    assert len(l.entries) == 2, "Không được xoá bút toán gốc"
