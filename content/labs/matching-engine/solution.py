class OrderBook:
    def __init__(self):
        self.bids = []
        self.asks = []
        self._seq = 0

    def _sort(self):
        self.bids.sort(key=lambda o: (-o[0], o[1]))
        self.asks.sort(key=lambda o: (o[0], o[1]))

    def best_bid(self):
        return self.bids[0][0] if self.bids else None

    def best_ask(self):
        return self.asks[0][0] if self.asks else None

    def submit(self, order_id, side, qty, price=None):
        if not isinstance(qty, int) or isinstance(qty, bool) or qty <= 0:
            raise ValueError("qty phải là số nguyên dương")
        if side not in ("buy", "sell"):
            raise ValueError("side phải là buy hoặc sell")
        if price is not None and price <= 0:
            raise ValueError("price phải > 0")
        book = self.asks if side == "buy" else self.bids

        def crosses(p):
            if price is None:
                return True
            return p <= price if side == "buy" else p >= price

        trades = []
        while qty > 0 and book and crosses(book[0][0]):
            maker = book[0]
            fill = min(qty, maker[3])
            trades.append((order_id, maker[2], maker[0], fill))
            maker[3] -= fill
            qty -= fill
            if maker[3] == 0:
                book.pop(0)
        if qty > 0 and price is not None:
            self._seq += 1
            (self.bids if side == "buy" else self.asks).append([price, self._seq, order_id, qty])
            self._sort()
        return trades

    def cancel(self, order_id):
        for book in (self.bids, self.asks):
            for i, o in enumerate(book):
                if o[2] == order_id:
                    book.pop(i)
                    return True
        return False
