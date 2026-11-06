class CardDeclined(Exception):
    pass


class PaymentAPI:
    def __init__(self, decline_amounts=()):
        self.decline_amounts = set(decline_amounts)
        self.charges = []
        self.store = {}

    def _charge(self, body):
        if body["amount"] in self.decline_amounts:
            raise CardDeclined()
        self.charges.append(body)
        return f"pay_{len(self.charges)}"

    def create_payment(self, key, body):
        if not key:
            return (400, {"error": "missing_idempotency_key"})
        if key in self.store:
            saved_body, result = self.store[key]
            if saved_body != body:
                return (422, {"error": "idempotency_key_reused"})
            return result
        try:
            pid = self._charge(body)
            result = (201, {"id": pid, "amount": body["amount"]})
        except CardDeclined:
            result = (402, {"error": "card_declined"})
        self.store[key] = (dict(body), result)
        return result
