import math


def idf(docs, term):
    n_docs = len(docs)
    n = sum(1 for toks in docs.values() if term in toks)
    return math.log((n_docs - n + 0.5) / (n + 0.5) + 1)


def bm25(docs, query_terms, k1=1.5, b=0.75):
    avgdl = sum(len(t) for t in docs.values()) / len(docs)
    scores = {}
    for d, toks in docs.items():
        s = 0.0
        for term in query_terms:
            f = toks.count(term)
            if f:
                s += idf(docs, term) * f * (k1 + 1) / (f + k1 * (1 - b + b * len(toks) / avgdl))
        scores[d] = s
    return scores


def rank(scores):
    return sorted(scores, key=lambda d: (-scores[d], d))


def rrf(rankings, k=60):
    total = {}
    for ranking in rankings:
        for pos, d in enumerate(ranking, start=1):
            total[d] = total.get(d, 0.0) + 1 / (k + pos)
    return rank(total)


def recall_at_k(results, relevant, k):
    hits = sum(1 for q, d in relevant.items() if d in results.get(q, [])[:k])
    return hits / len(relevant)
