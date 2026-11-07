import base64
import hashlib
import hmac
import json


def b64url_decode(s):
    # TODO: thêm padding "=" rồi giải mã urlsafe
    raise NotImplementedError


def verify(token, secret, now, audience):
    # TODO
    return (False, "malformed")
