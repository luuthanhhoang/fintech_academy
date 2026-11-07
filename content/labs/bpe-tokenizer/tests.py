CORPUS = {"low": 5, "lower": 2, "newest": 6, "widest": 3}


def test_dem_cap():
    c = pair_counts({("l", "o", "w"): 5, ("l", "o"): 2})
    assert c[("l", "o")] == 7 and c[("o", "w")] == 5


def test_gop_khong_chong_lan():
    v = merge({("a", "a", "a"): 1}, ("a", "a"))
    assert v == {("aa", "a"): 1}, "Quét trái sang phải, không gộp chồng lấn"


def test_phep_gop_dau_tien():
    merges = train(CORPUS, 1)
    # ('e','s') xuất hiện 6 + 3 = 9 lần; ('s','t') cũng 9 → hoà, chọn tuple nhỏ hơn ('e','s')
    assert merges == [("e", "s")]


def test_tu_pho_bien_thanh_it_token():
    merges = train(CORPUS, 10)
    assert len(encode("newest", merges)) < len("newest")
    assert len(encode("lowest", merges)) <= len("lowest")


def test_tu_la_tach_nho():
    merges = train(CORPUS, 10)
    assert encode("zzz", merges) == ["z", "z", "z"], "Ký tự chưa từng thấy giữ nguyên từng ký tự"


def test_dung_som():
    assert train({"ab": 1}, 5) == [("a", "b")]
