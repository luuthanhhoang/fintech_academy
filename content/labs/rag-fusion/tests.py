import math

DOCS = {
    "d1": "ma loi e-4012 khi thanh toan the".split(),
    "d2": "huong dan hoan tien cho khach hang".split(),
    "d3": "loi thanh toan thuong gap va cach xu ly".split(),
}


def test_idf():
    assert abs(idf(DOCS, "e-4012") - math.log(2.5 / 1.5 + 1)) < 1e-12
    assert idf(DOCS, "e-4012") > idf(DOCS, "thanh"), "Từ hiếm có IDF cao hơn"


def test_bm25_khop_ma():
    order = rank(bm25(DOCS, ["e-4012"]))
    assert order[0] == "d1"


def test_rank_hoa():
    assert rank({"b": 1.0, "a": 1.0, "c": 2.0}) == ["c", "a", "b"]


def test_rrf_bai_hoc():
    # Ví dụ trong bài: A BM25 hạng 1, vector hạng 8; B 2 và 1; C 10 và 2 → B > A > C
    bm = ["A", "B", "x3", "x4", "x5", "x6", "x7", "x8", "x9", "C"]
    vec = ["B", "C", "y3", "y4", "y5", "y6", "y7", "A"]
    fused = rrf([bm, vec])
    pos = {d: i for i, d in enumerate(fused)}
    assert pos["B"] < pos["A"] < pos["C"]


def test_recall():
    res = {"q1": ["d1", "d2"], "q2": ["d3", "d1"], "q3": ["d2"]}
    rel = {"q1": "d1", "q2": "d1", "q3": "d3"}
    assert abs(recall_at_k(res, rel, 1) - 1 / 3) < 1e-12
    assert abs(recall_at_k(res, rel, 2) - 2 / 3) < 1e-12
