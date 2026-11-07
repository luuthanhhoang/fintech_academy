def pair_counts(vocab):
    counts = {}
    for symbols, freq in vocab.items():
        for a, b in zip(symbols, symbols[1:]):
            counts[(a, b)] = counts.get((a, b), 0) + freq
    return counts


def _merge_symbols(symbols, pair):
    out, i = [], 0
    while i < len(symbols):
        if i + 1 < len(symbols) and (symbols[i], symbols[i + 1]) == pair:
            out.append(symbols[i] + symbols[i + 1])
            i += 2
        else:
            out.append(symbols[i])
            i += 1
    return tuple(out)


def merge(vocab, pair):
    new = {}
    for symbols, freq in vocab.items():
        key = _merge_symbols(symbols, pair)
        new[key] = new.get(key, 0) + freq
    return new


def train(corpus, num_merges):
    vocab = {tuple(w): c for w, c in corpus.items()}
    merges = []
    for _ in range(num_merges):
        counts = pair_counts(vocab)
        if not counts:
            break
        best = min(counts, key=lambda p: (-counts[p], p))
        vocab = merge(vocab, best)
        merges.append(best)
    return merges


def encode(word, merges):
    symbols = tuple(word)
    for pair in merges:
        symbols = _merge_symbols(symbols, pair)
    return list(symbols)
