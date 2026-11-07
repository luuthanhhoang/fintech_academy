class FakeDB:
    def __init__(self):
        self.rows = {i: {"id": i, "name": f"KH{i}"} for i in range(1, 6)}
        self.calls = []

    def query(self, ids):
        self.calls.append(list(ids))
        return {i: self.rows[i] for i in ids if i in self.rows}


ORDERS = [{"id": n, "customer_id": c} for n, c in enumerate([1, 2, 1, 3, 2, 1, 4], start=1)]


def test_n_cong_1():
    db = FakeDB()
    out = naive_load_customers(db, ORDERS)
    assert [c["id"] for c in out] == [1, 2, 1, 3, 2, 1, 4]
    assert len(db.calls) == len(ORDERS), "Cách ngây thơ: một truy vấn cho mỗi đơn"


def test_gop_mot_truy_van():
    db = FakeDB()
    loader = BatchLoader(db.query)
    getters = [loader.load(o["customer_id"]) for o in ORDERS]
    loader.dispatch()
    assert db.calls == [[1, 2, 3, 4]], "Một truy vấn, không trùng id, giữ thứ tự"
    assert [g()["id"] for g in getters] == [1, 2, 1, 3, 2, 1, 4]


def test_cache_giua_cac_luot():
    db = FakeDB()
    loader = BatchLoader(db.query)
    loader.load(1)
    loader.dispatch()
    g = loader.load(1)
    h = loader.load(5)
    loader.dispatch()
    assert db.calls == [[1], [5]]
    assert g()["id"] == 1 and h()["id"] == 5


def test_khong_co_id_moi_khong_goi():
    db = FakeDB()
    loader = BatchLoader(db.query)
    loader.dispatch()
    assert db.calls == []


def test_id_khong_ton_tai():
    db = FakeDB()
    loader = BatchLoader(db.query)
    g = loader.load(99)
    loader.dispatch()
    assert g() is None
