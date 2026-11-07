def reconcile(internal, external):
    """Trả về dict: matched, amount_mismatch, missing_external, missing_internal."""
    # TODO: tầng 1 — ghép theo ref
    # TODO: tầng 2 — ghép theo (account, amount, date) khi chỉ có đúng một ứng viên
    return {"matched": [], "amount_mismatch": [], "missing_external": [], "missing_internal": []}
