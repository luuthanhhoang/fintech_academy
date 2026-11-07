def cash_for_debt(revenue, ebitda_margin, fixed_outflows):
    raise NotImplementedError


def debt_service(debt, rate, principal):
    raise NotImplementedError


def dscr(revenue, ebitda_margin, fixed_outflows, debt, rate, principal):
    raise NotImplementedError


def stress(base, revenue_drop, rate_shock):
    raise NotImplementedError


def break_even_drop(base):
    raise NotImplementedError


def covenant_breaches(base, scenarios, min_dscr):
    raise NotImplementedError
