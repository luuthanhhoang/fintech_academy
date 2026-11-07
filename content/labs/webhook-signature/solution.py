import base64
import hashlib
import hmac


class WebhookVerifier:
    def __init__(self, secret, tolerance_seconds=300):
        self.secret = secret
        self.tolerance = tolerance_seconds
        self.seen = set()

    def sign(self, msg_id, timestamp, body):
        signed = msg_id.encode() + b"." + str(timestamp).encode() + b"." + body
        digest = hmac.new(self.secret, signed, hashlib.sha256).digest()
        return base64.b64encode(digest).decode()

    def verify(self, headers, body, now):
        keys = ("webhook-id", "webhook-timestamp", "webhook-signature")
        if any(not headers.get(k) for k in keys):
            return "missing_headers"
        msg_id = headers["webhook-id"]
        try:
            ts = int(headers["webhook-timestamp"])
        except ValueError:
            return "timestamp_out_of_range"
        if abs(now - ts) > self.tolerance:
            return "timestamp_out_of_range"
        expected = self.sign(msg_id, ts, body)
        ok = False
        for entry in headers["webhook-signature"].split():
            version, _, sig = entry.partition(",")
            if version == "v1" and hmac.compare_digest(sig, expected):
                ok = True
        if not ok:
            return "invalid_signature"
        if msg_id in self.seen:
            return "duplicate"
        self.seen.add(msg_id)
        return "ok"
