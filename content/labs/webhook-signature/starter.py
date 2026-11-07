import base64
import hashlib
import hmac


class WebhookVerifier:
    def __init__(self, secret, tolerance_seconds=300):
        self.secret = secret
        self.tolerance = tolerance_seconds
        # TODO: lưu các id đã xử lý

    def sign(self, msg_id, timestamp, body):
        """Trả về chữ ký base64 (không có tiền tố v1,)."""
        # TODO
        raise NotImplementedError

    def verify(self, headers, body, now):
        # TODO
        return "invalid_signature"
