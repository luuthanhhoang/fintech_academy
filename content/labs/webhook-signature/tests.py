import base64
import hashlib
import hmac as _hmac

SECRET = b"bi-mat-thu-nghiem"
BODY = b'{"type":"payment.succeeded","amount":150000}'


def _sig(secret, msg_id, ts, body):
    signed = msg_id.encode() + b"." + str(ts).encode() + b"." + body
    return base64.b64encode(_hmac.new(secret, signed, hashlib.sha256).digest()).decode()


def _headers(msg_id="msg_1", ts=1000, sig=None):
    return {"webhook-id": msg_id, "webhook-timestamp": str(ts),
            "webhook-signature": sig if sig is not None else "v1," + _sig(SECRET, msg_id, ts, BODY)}


def test_hop_le():
    v = WebhookVerifier(SECRET, 300)
    assert v.verify(_headers(), BODY, 1010) == "ok"


def test_ky_dung_dinh_dang():
    v = WebhookVerifier(SECRET, 300)
    assert v.sign("msg_1", 1000, BODY) == _sig(SECRET, "msg_1", 1000, BODY)


def test_body_bi_sua():
    v = WebhookVerifier(SECRET, 300)
    assert v.verify(_headers(), BODY.replace(b"150000", b"990000"), 1010) == "invalid_signature"


def test_phat_lai_qua_han():
    v = WebhookVerifier(SECRET, 300)
    assert v.verify(_headers(), BODY, 1000 + 301) == "timestamp_out_of_range"


def test_thieu_header():
    v = WebhookVerifier(SECRET, 300)
    h = _headers()
    del h["webhook-signature"]
    assert v.verify(h, BODY, 1000) == "missing_headers"


def test_xoay_vong_bi_mat():
    v = WebhookVerifier(SECRET, 300)
    old = "v1," + _sig(b"bi-mat-cu", "msg_2", 1000, BODY)
    new = "v1," + _sig(SECRET, "msg_2", 1000, BODY)
    assert v.verify(_headers("msg_2", 1000, old + " " + new), BODY, 1000) == "ok"


def test_trung_lap():
    v = WebhookVerifier(SECRET, 300)
    assert v.verify(_headers(), BODY, 1000) == "ok"
    assert v.verify(_headers(), BODY, 1001) == "duplicate"
