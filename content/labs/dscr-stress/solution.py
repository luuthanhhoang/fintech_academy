def cash_for_debt(revenue, ebitda_margin, fixed_outflows):
    return revenue * ebitda_margin - fixed_outflows


def debt_service(debt, rate, principal):
    return principal + rate * debt


def dscr(revenue, ebitda_margin, fixed_outflows, debt, rate, principal):
    return cash_for_debt(revenue, ebitda_margin, fixed_outflows) / debt_service(debt, rate, principal)


def stress(base, revenue_drop, rate_shock):
    b = dict(base)
    b["revenue"] = base["revenue"] * (1 - revenue_drop)
    b["rate"] = base["rate"] + rate_shock
    return dscr(**b)


def break_even_drop(base):
    need = debt_service(base["debt"], base["rate"], base["principal"]) + base["fixed_outflows"]
    revenue_needed = need / base["ebitda_margin"]
    drop = 1 - revenue_needed / base["revenue"]
    return max(0.0, drop)


def covenant_breaches(base, scenarios, min_dscr):
    return sorted(name for name, (d, s) in scenarios.items() if stress(base, d, s) < min_dscr)
