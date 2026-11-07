import base64 as _b64
import hashlib as _hl
import hmac as _hm
import json as _js

KEY = b"khoa-bi-mat-thu-nghiem"


def _enc(obj):
    return _b64.urlsafe_b64encode(_js.dumps(obj).encode()).rstrip(b"=").decode()


def _make(payload, alg="HS256", key=KEY):
    h, p = _enc({"alg": alg, "typ": "JWT"}), _enc(payload)
    sig = _b64.urlsafe_b64encode(_hm.new(key, (h + "." + p).encode(), _hl.sha256).digest()).rstrip(b"=").decode()
    return h + "." + p + "." + sig


GOOD = {"sub": "u1", "aud": "finai", "exp": 2000, "nbf": 1000}


def test_hop_le():
    ok, payload = verify(_make(GOOD), KEY, 1500, "finai")
    assert ok and payload["sub"] == "u1"


def test_tu_choi_alg_none():
    h, p = _enc({"alg": "none"}), _enc(GOOD)
    assert verify(h + "." + p + ".", KEY, 1500, "finai") == (False, "bad_alg")


def test_sai_chu_ky():
    assert verify(_make(GOOD, key=b"khoa-khac"), KEY, 1500, "finai") == (False, "bad_signature")


def test_payload_bi_sua():
    t = _make(GOOD).split(".")
    t[1] = _enc(dict(GOOD, sub="admin"))
    assert verify(".".join(t), KEY, 1500, "finai") == (False, "bad_signature")


def test_het_han_va_chua_hieu_luc():
    assert verify(_make(GOOD), KEY, 2000, "finai") == (False, "expired")
    assert verify(_make(GOOD), KEY, 999, "finai") == (False, "not_yet_valid")


def test_audience():
    assert verify(_make(GOOD), KEY, 1500, "app-khac") == (False, "bad_audience")


def test_sai_cau_truc():
    assert verify("abc", KEY, 1500, "finai") == (False, "malformed")
