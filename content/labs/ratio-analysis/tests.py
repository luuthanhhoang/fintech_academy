FS = {"revenue": 1000, "cogs": 700, "ebit": 120, "interest": 30, "net_income": 70, "total_assets": 800,
      "equity": 320, "current_assets": 300, "current_liabilities": 250, "cfo": 40, "receivables": 150}


def _close(a, b, tol=1e-9):
    return abs(a - b) <= tol


def test_ti_so():
    r = ratios(FS)
    assert _close(r["gross_margin"], 0.30) and _close(r["net_margin"], 0.07)
    assert _close(r["roe"], 70 / 320) and _close(r["debt_to_equity"], 1.5)
    assert _close(r["interest_cover"], 4.0) and _close(r["current_ratio"], 1.2)


def test_khong_lai_vay():
    assert ratios(dict(FS, interest=0))["interest_cover"] is None


def test_dupont_bang_roe():
    m, t, l = dupont(FS)
    assert _close(m * t * l, ratios(FS)["roe"])


def test_co_canh_bao():
    prev = dict(FS, revenue=900, net_income=72, receivables=100, total_assets=700, equity=360, cfo=80)
    flags = quality_flags(prev, FS)
    assert flags == ["cfo_below_profit", "leverage_driven_roe", "receivables_outpace_sales"]


def test_khong_canh_bao():
    good = dict(FS, cfo=90)
    prev = dict(good, revenue=900, receivables=140, net_income=60, total_assets=800, equity=320)
    assert quality_flags(prev, good) == []
