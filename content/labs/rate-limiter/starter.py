class TokenBucket:
    def __init__(self, capacity, refill_per_sec):
        # TODO: kiểm tra tham số, khởi tạo số token và mốc thời gian lần nạp gần nhất
        pass

    def _refill(self, now):
        # TODO: cộng token theo thời gian trôi qua, không vượt capacity
        pass

    def allow(self, now, cost=1):
        # TODO
        return True

    def retry_after(self, now, cost=1):
        # TODO
        return 0.0
