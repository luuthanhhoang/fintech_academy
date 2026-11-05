def mean(xs):
    if len(xs) == 0:
        raise ValueError("Cần ít nhất 1 điểm dữ liệu")
    return sum(xs) / len(xs)


def covariance(xs, ys):
    if len(xs) != len(ys):
        raise ValueError("Hai chuỗi phải cùng độ dài")
    if len(xs) < 2:
        raise ValueError("Cần ít nhất 2 điểm dữ liệu")
    mx, my = mean(xs), mean(ys)
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (len(xs) - 1)


def variance(xs):
    return covariance(xs, xs)


def portfolio_return(weights, mus):
    if len(weights) != len(mus):
        raise ValueError("Độ dài không khớp")
    return sum(w * m for w, m in zip(weights, mus))


def portfolio_variance(weights, cov):
    n = len(weights)
    if len(cov) != n or any(len(row) != n for row in cov):
        raise ValueError("Ma trận hiệp phương sai phải n x n")
    return sum(weights[i] * cov[i][j] * weights[j] for i in range(n) for j in range(n))


def min_variance_weight(s1, s2, rho):
    c = rho * s1 * s2
    denom = s1 * s1 + s2 * s2 - 2 * c
    if denom == 0:
        raise ValueError("Không xác định khi hai tài sản giống hệt về rủi ro (rho = 1, s1 = s2)")
    return (s2 * s2 - c) / denom
