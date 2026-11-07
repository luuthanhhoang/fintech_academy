import base64
import hashlib
import hmac
import json


def b64url_decode(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def verify(token, secret, now, audience):
    parts = token.split(".")
    if len(parts) != 3:
        return (False, "malformed")
    h64, p64, s64 = parts
    try:
        header = json.loads(b64url_decode(h64))
        payload = json.loads(b64url_decode(p64))
        sig = b64url_decode(s64)
    except Exception:
        return (False, "malformed")
    if not isinstance(header, dict) or not isinstance(payload, dict):
        return (False, "malformed")
    if header.get("alg") != "HS256":
        return (False, "bad_alg")
    expected = hmac.new(secret, (h64 + "." + p64).encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(sig, expected):
        return (False, "bad_signature")
    if "exp" in payload and now >= payload["exp"]:
        return (False, "expired")
    if "nbf" in payload and now < payload["nbf"]:
        return (False, "not_yet_valid")
    if payload.get("aud") != audience:
        return (False, "bad_audience")
    return (True, payload)
