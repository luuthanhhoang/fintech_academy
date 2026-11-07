def test_cham_json():
    g = grade_json('{"order_id": "A1", "summary": "Khach bao giao hang tre"}', "A1")
    assert g == {"valid_json": True, "has_order_id": True, "short": True}


def test_json_loi():
    assert grade_json("khong phai json", "A1") == {"valid_json": False, "has_order_id": False, "short": False}


def test_qua_dai():
    long = " ".join(["tu"] * 81)
    g = grade_json('{"order_id": "A1", "summary": "' + long + '"}', "A1")
    assert g["short"] is False


def test_ti_le_dat():
    gs = [{"x": True}, {"x": False}, {"x": True}, {"x": True}]
    assert pass_rate(gs, "x") == 0.75


def test_dong_thuan():
    assert agreement([True, True, False, False], [True, False, False, False]) == 0.75
    try:
        agreement([True], [True, False])
    except ValueError:
        pass
    else:
        raise AssertionError("Phải raise ValueError")


def test_cong_chan_dung_tieu_chi():
    base = {"has_order_id": 0.97, "short": 0.90}
    cand = {"has_order_id": 0.88, "short": 0.89}
    # n = 200: se(0.97) ≈ 0.0121 → ngưỡng ≈ 0.946; se(0.90) ≈ 0.0212 → ngưỡng ≈ 0.858
    assert gate(base, cand, 200) == ["has_order_id"], "Tụt 9 điểm vượt nhiễu; tụt 1 điểm nằm trong nhiễu"
