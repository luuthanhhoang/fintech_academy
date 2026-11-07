def ratios(fs):
    debt = fs["total_assets"] - fs["equity"]
    return {
        "gross_margin": (fs["revenue"] - fs["cogs"]) / fs["revenue"],
        "net_margin": fs["net_income"] / fs["revenue"],
        "roa": fs["net_income"] / fs["total_assets"],
        "roe": fs["net_income"] / fs["equity"],
        "current_ratio": fs["current_assets"] / fs["current_liabilities"],
        "debt_to_equity": debt / fs["equity"],
        "interest_cover": fs["ebit"] / fs["interest"] if fs["interest"] else None,
    }


def dupont(fs):
    return (fs["net_income"] / fs["revenue"], fs["revenue"] / fs["total_assets"], fs["total_assets"] / fs["equity"])


def quality_flags(prev, cur):
    flags = []
    if cur["cfo"] < cur["net_income"]:
        flags.append("cfo_below_profit")
    rec_g = cur["receivables"] / prev["receivables"] - 1
    rev_g = cur["revenue"] / prev["revenue"] - 1
    if rec_g > rev_g + 0.10:
        flags.append("receivables_outpace_sales")
    rp, rc = ratios(prev), ratios(cur)
    if rc["roe"] > rp["roe"] and rc["net_margin"] < rp["net_margin"]:
        flags.append("leverage_driven_roe")
    return sorted(flags)
