BASE = {"revenue": 500.0, "ebitda_margin": 0.12, "fixed_outflows": 20.0, "debt": 125.0, "rate": 0.08, "principal": 20.0}


def _close(a, b, tol=1e-9):
    return abs(a - b) <= tol


def test_dscr_co_so():
    # dòng tiền 40, nghĩa vụ 20 + 10 = 30
    assert _close(dscr(**BASE), 40 / 30)


def test_cang_thang():
    # doanh thu 400 → dòng tiền 28; lãi 11% → nghĩa vụ 20 + 13,75
    assert _close(stress(BASE, 0.2, 0.03), 28 / 33.75)


def test_diem_gay():
    d = break_even_drop(BASE)
    assert _close(stress(BASE, d, 0.0), 1.0, 1e-9)
    assert _close(d, 1 - (30 + 20) / 0.12 / 500)


def test_da_duoi_1():
    b = dict(BASE, revenue=300.0)
    assert break_even_drop(b) == 0.0


def test_covenant():
    sc = {"co-so": (0.0, 0.0), "doanh-thu-giam": (0.2, 0.0), "lai-tang": (0.0, 0.03), "ket-hop": (0.2, 0.03)}
    assert covenant_breaches(BASE, sc, 1.2) == ["doanh-thu-giam", "ket-hop", "lai-tang"], "Lãi +3 điểm: 40 / 33,75 ≈ 1,185 < 1,2"
