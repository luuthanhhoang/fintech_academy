def simulate(entry, settles, size, side, initial, maintenance, can_pay):
    balance = initial
    prev = entry
    balances, calls = [], []
    total = 0
    closed = None
    for t, price in enumerate(settles):
        pnl = side * (price - prev) * size
        total += pnl
        balance += pnl
        prev = price
        if balance < maintenance:
            amount = initial - balance
            calls.append((t, amount))
            if can_pay(t):
                balance += amount
            else:
                balances.append(balance)
                closed = t
                break
        balances.append(balance)
    return {"balances": balances, "calls": calls, "closed_day": closed, "total_pnl": total}
