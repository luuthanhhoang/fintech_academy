DEBIT_NORMAL = {"asset", "expense"}
CREDIT_NORMAL = {"liability", "equity", "revenue"}


class Ledger:
    def __init__(self):
        self.accounts = {}
        self.entries = []

    def open_account(self, name, kind):
        if kind not in DEBIT_NORMAL | CREDIT_NORMAL:
            raise ValueError(f"Loại tài khoản không hợp lệ: {kind}")
        self.accounts[name] = kind

    def post(self, description, lines):
        if len(lines) < 2:
            raise ValueError("Bút toán cần ít nhất 2 dòng")
        total_dr = total_cr = 0
        for account, dr, cr in lines:
            if account not in self.accounts:
                raise ValueError(f"Chưa mở tài khoản {account}")
            for amount in (dr, cr):
                if not isinstance(amount, int) or isinstance(amount, bool) or amount < 0:
                    raise ValueError("Số tiền phải là số nguyên không âm (đơn vị nhỏ nhất)")
            if dr > 0 and cr > 0:
                raise ValueError("Một dòng không được vừa Nợ vừa Có")
            total_dr += dr
            total_cr += cr
        if total_dr != total_cr or total_dr == 0:
            raise ValueError(f"Bút toán không cân: Nợ {total_dr} ≠ Có {total_cr}")
        self.entries.append((description, tuple(lines)))
        return len(self.entries) - 1

    def balance(self, account):
        dr = sum(d for _, lines in self.entries for a, d, _c in lines if a == account)
        cr = sum(c for _, lines in self.entries for a, _d, c in lines if a == account)
        return dr - cr if self.accounts[account] in DEBIT_NORMAL else cr - dr

    def trial_balance(self):
        dr = sum(d for _, lines in self.entries for _a, d, _c in lines)
        cr = sum(c for _, lines in self.entries for _a, _d, c in lines)
        return dr, cr

    def reverse(self, index, description="Bút toán đảo"):
        _, lines = self.entries[index]
        return self.post(description, [(a, c, d) for a, d, c in lines])
