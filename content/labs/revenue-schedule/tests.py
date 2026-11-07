def test_phan_bo_vi_du_bai():
    assert allocate(3000000, [1000000, 3000000]) == [750000, 2250000]


def test_phan_bo_khong_mat_dong():
    parts = allocate(10000000, [4000000, 8000000])
    assert sum(parts) == 10000000
    assert parts == [3333333, 6666667]


def test_lich_thang():
    s = schedule(1000, 3)
    assert s == [334, 333, 333] and sum(s) == 1000


def test_doanh_thu_chua_thuc_hien():
    assert deferred_after(2400000, 12, 3) == 1800000


def test_ghi_nhan_thang_dau():
    comps = [{"amount": 750000, "months": 0}, {"amount": 2250000, "months": 12}]
    assert recognized(comps, 1) == 937500
    assert recognized(comps, 2) == 187500
    assert recognized(comps, 13) == 0
