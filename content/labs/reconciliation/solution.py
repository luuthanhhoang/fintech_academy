def reconcile(internal, external):
    used_e = set()
    used_i = set()
    matched, mismatch = [], []

    by_ref = {}
    for j, e in enumerate(external):
        if e.get("ref") is not None:
            by_ref.setdefault(e["ref"], []).append(j)

    for i, t in enumerate(internal):
        ref = t.get("ref")
        if ref is None:
            continue
        for j in by_ref.get(ref, []):
            if j in used_e:
                continue
            used_e.add(j)
            used_i.add(i)
            (matched if external[j]["amount"] == t["amount"] else mismatch).append((i, j))
            break

    for i, t in enumerate(internal):
        if i in used_i:
            continue
        key = (t["account"], t["amount"], t["date"])
        cands = [j for j, e in enumerate(external)
                 if j not in used_e and (e["account"], e["amount"], e["date"]) == key]
        if len(cands) == 1:
            used_e.add(cands[0])
            used_i.add(i)
            matched.append((i, cands[0]))

    return {
        "matched": sorted(matched),
        "amount_mismatch": sorted(mismatch),
        "missing_external": sorted(i for i in range(len(internal)) if i not in used_i),
        "missing_internal": sorted(j for j in range(len(external)) if j not in used_e),
    }
