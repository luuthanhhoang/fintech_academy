class OrderBook:
    def __init__(self):
        self.bids = []  # mỗi phần tử: [price, seq, order_id, qty]
        self.asks = []
        self._seq = 0

    def best_bid(self):
        # TODO
        raise NotImplementedError

    def best_ask(self):
        # TODO
        raise NotImplementedError

    def submit(self, order_id, side, qty, price=None):
        """Trả về list các giao dịch (taker_id, maker_id, price, qty)."""
        # TODO: kiểm tra đầu vào, khớp theo ưu tiên giá–thời gian, đưa phần dư (nếu là lệnh giới hạn) vào sổ
        raise NotImplementedError

    def cancel(self, order_id):
        # TODO
        raise NotImplementedError
