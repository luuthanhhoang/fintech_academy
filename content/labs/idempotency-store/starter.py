class CardDeclined(Exception):
    pass


class PaymentAPI:
    def __init__(self, decline_amounts=()):
        self.decline_amounts = set(decline_amounts)
        self.charges = []  # mỗi lần thực sự trừ tiền sẽ thêm 1 phần tử
        # TODO: kho lưu theo idempotency key

    def _charge(self, body):
        if body["amount"] in self.decline_amounts:
            raise CardDeclined()
        self.charges.append(body)
        return f"pay_{len(self.charges)}"

    def create_payment(self, key, body):
        # TODO
        return (201, {})
