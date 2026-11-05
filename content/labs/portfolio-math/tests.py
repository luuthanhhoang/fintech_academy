def _close(a, b, tol=1e-9):
    return abs(a - b) <= tol


def test_mean_variance():
    xs = [2, 4, 4, 4, 5, 5, 7, 9]
    assert _close(mean(xs), 5)
    assert _close(variance(xs), 32 / 7), "Phương sai mẫu chia n - 1"


def test_covariance_doi_xung():
    xs, ys = [1, 2, 3, 4], [2, 4, 5, 9]
    assert _close(covariance(xs, ys), covariance(ys, xs))
    assert _close(covariance(xs, xs), variance(xs))


def test_loi_suat_danh_muc():
    assert _close(portfolio_return([0.5, 0.5], [0.10, 0.04]), 0.07)


def test_phuong_sai_danh_muc_hai_tai_san():
    s1, s2, rho = 0.2, 0.1, 0.3
    cov = [[s1 * s1, rho * s1 * s2], [rho * s1 * s2, s2 * s2]]
    w = [0.4, 0.6]
    expected = w[0] ** 2 * s1 ** 2 + w[1] ** 2 * s2 ** 2 + 2 * w[0] * w[1] * rho * s1 * s2
    assert _close(portfolio_variance(w, cov), expected)


def test_da_dang_hoa_giam_rui_ro():
    s, rho = 0.2, 0.0
    cov = [[s * s, rho * s * s], [rho * s * s, s * s]]
    assert portfolio_variance([0.5, 0.5], cov) < s * s, "Hai tài sản không tương quan: chia đôi phải giảm phương sai"


def test_trong_so_rui_ro_toi_thieu():
    w = min_variance_weight(0.2, 0.1, 0.3)
    s1, s2, rho = 0.2, 0.1, 0.3

    def var(x):
        return x * x * s1 * s1 + (1 - x) ** 2 * s2 * s2 + 2 * x * (1 - x) * rho * s1 * s2
    assert var(w) <= var(w + 1e-4) and var(w) <= var(w - 1e-4)


def test_kiem_tra_dau_vao():
    for fn, args in [(covariance, ([1, 2], [1])), (variance, ([1],)), (portfolio_return, ([1], [1, 2]))]:
        try:
            fn(*args)
        except ValueError:
            continue
        raise AssertionError(f"{fn.__name__} phải raise ValueError")
