def allocate(price, ssp):
    total = sum(ssp)
    raw = [price * s / total for s in ssp]
    parts = [int(r) for r in raw]
    rest = price - sum(parts)
    order = sorted(range(len(ssp)), key=lambda i: (-(raw[i] - parts[i]), i))
    for i in order[:rest]:
        parts[i] += 1
    return parts


def schedule(amount, months):
    base, rest = divmod(amount, months)
    return [base + (1 if i < rest else 0) for i in range(months)]


def deferred_after(amount, months, elapsed):
    return amount - sum(schedule(amount, months)[:elapsed])


def recognized(components, month):
    total = 0
    for c in components:
        if c["months"] == 0:
            total += c["amount"] if month == 1 else 0
        elif month <= c["months"]:
            total += schedule(c["amount"], c["months"])[month - 1]
    return total
