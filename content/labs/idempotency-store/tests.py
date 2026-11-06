def test_first_request_creates_payment():
    api = PaymentAPI()
    status, res = api.create_payment("k1", {"amount": 150000, "to": "acc-1"})
    assert status == 201 and res["id"] == "pay_1" and len(api.charges) == 1


def test_retry_same_key_does_not_charge_twice():
    api = PaymentAPI()
    first = api.create_payment("k1", {"amount": 150000, "to": "acc-1"})
    again = api.create_payment("k1", {"to": "acc-1", "amount": 150000})
    assert first == again
    assert len(api.charges) == 1


def test_reused_key_with_different_body_is_rejected():
    api = PaymentAPI()
    api.create_payment("k1", {"amount": 150000, "to": "acc-1"})
    status, res = api.create_payment("k1", {"amount": 990000, "to": "acc-1"})
    assert status == 422 and res["error"] == "idempotency_key_reused"
    assert len(api.charges) == 1


def test_missing_key():
    api = PaymentAPI()
    assert api.create_payment(None, {"amount": 1, "to": "a"})[0] == 400
    assert api.create_payment("", {"amount": 1, "to": "a"})[0] == 400
    assert api.charges == []


def test_declined_is_remembered():
    api = PaymentAPI(decline_amounts=[500])
    assert api.create_payment("k9", {"amount": 500, "to": "a"}) == (402, {"error": "card_declined"})
    api.decline_amounts.clear()
    assert api.create_payment("k9", {"amount": 500, "to": "a"}) == (402, {"error": "card_declined"})
    assert api.charges == []


def test_different_keys_are_independent():
    api = PaymentAPI()
    api.create_payment("a", {"amount": 1, "to": "x"})
    status, res = api.create_payment("b", {"amount": 1, "to": "x"})
    assert status == 201 and res["id"] == "pay_2"
