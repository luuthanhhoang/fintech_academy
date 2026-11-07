def _t(ref, amount, account="A", date="2026-01-02"):
    return {"ref": ref, "amount": amount, "account": account, "date": date}


def test_ghep_theo_ref():
    r = reconcile([_t("r1", 100), _t("r2", 200)], [_t("r2", 200), _t("r1", 100)])
    assert r["matched"] == [(0, 1), (1, 0)]
    assert r["missing_external"] == [] and r["missing_internal"] == []


def test_lech_so_tien():
    r = reconcile([_t("r1", 100)], [_t("r1", 98)])
    assert r["amount_mismatch"] == [(0, 0)], "Cùng ref nhưng khác số tiền là lệch số tiền"
    assert r["matched"] == []


def test_thieu_hai_phia():
    r = reconcile([_t("r1", 100), _t("r9", 50)], [_t("r1", 100), _t("x7", 22000)])
    assert r["missing_external"] == [1]
    assert r["missing_internal"] == [1]


def test_tang_2_khoa_phu():
    r = reconcile([_t(None, 300, "B")], [_t(None, 300, "B")])
    assert r["matched"] == [(0, 0)], "Không có ref thì ghép theo (account, amount, date)"


def test_tang_2_nhieu_ung_vien_khong_ghep():
    r = reconcile([_t(None, 300, "B")], [_t(None, 300, "B"), _t(None, 300, "B")])
    assert r["matched"] == [], "Nhiều ứng viên → để người xem, không đoán"
    assert r["missing_external"] == [0] and r["missing_internal"] == [0, 1]


def test_khong_ghep_hai_lan():
    r = reconcile([_t("r1", 100), _t("r1", 100)], [_t("r1", 100)])
    assert r["matched"] == [(0, 0)]
    assert r["missing_external"] == [1], "Một dòng bên ngoài chỉ ghép được một lần"


def test_tien_la_so_nguyen():
    r = reconcile([_t("r1", 10)], [_t("r1", 10)])
    assert r["matched"] == [(0, 0)]
