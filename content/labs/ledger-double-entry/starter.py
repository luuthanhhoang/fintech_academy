DEBIT_NORMAL = {"asset", "expense"}
CREDIT_NORMAL = {"liability", "equity", "revenue"}


class Ledger:
    def __init__(self):
        self.accounts = {}   # tên tài khoản -> loại ("asset", "liability", ...)
        self.entries = []    # danh sách bút toán đã ghi (không được sửa)

    def open_account(self, name, kind):
        if kind not in DEBIT_NORMAL | CREDIT_NORMAL:
            raise ValueError(f"Loại tài khoản không hợp lệ: {kind}")
        self.accounts[name] = kind

    def post(self, description, lines):
        """lines: list of (account, debit, credit). Ghi bút toán nếu hợp lệ, trả về chỉ số bút toán."""
        # TODO: kiểm tra hợp lệ rồi lưu vào self.entries
        raise NotImplementedError

    def balance(self, account):
        # TODO: số dư theo phía tự nhiên của tài khoản
        raise NotImplementedError

    def trial_balance(self):
        # TODO: (tổng nợ, tổng có)
        raise NotImplementedError

    def reverse(self, index, description="Bút toán đảo"):
        """Ghi một bút toán đảo ngược bút toán `index` (đổi chiều nợ/có)."""
        # TODO
        raise NotImplementedError
