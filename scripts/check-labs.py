"""Run every lab's tests against its reference solution (must pass) and its starter (must not fully pass).

Mirrors the in-browser harness in lib/lab/protocol.ts: exec the code, then exec tests.py and call every test_*.
Usage: python3 -I scripts/check-labs.py [content/labs]
"""
import os
import sys


def run(lab_dir, code_file):
    ns = {}
    exec(compile(open(os.path.join(lab_dir, code_file), encoding="utf-8").read(), code_file, "exec"), ns)
    exec(compile(open(os.path.join(lab_dir, "tests.py"), encoding="utf-8").read(), "tests.py", "exec"), ns)
    tests = [name for name in list(ns) if name.startswith("test_") and callable(ns[name])]
    failed = []
    for name in tests:
        try:
            ns[name]()
        except Exception:  # noqa: BLE001 — any failure counts
            failed.append(name)
    return tests, failed


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "content", "labs")
    problems = []
    for lab in sorted(os.listdir(root)):
        lab_dir = os.path.join(root, lab)
        if not os.path.isdir(lab_dir):
            continue
        tests, failed = run(lab_dir, "solution.py")
        if failed:
            problems.append(f"{lab}: lời giải trượt {failed}")
        _, starter_failed = run(lab_dir, "starter.py")
        if not starter_failed:
            problems.append(f"{lab}: code khởi đầu đã qua mọi test — bài lab không có gì để làm")
        print(f"{'✗' if failed else '✓'} {lab}: {len(tests) - len(failed)}/{len(tests)} test (lời giải)")
    if problems:
        print("\n".join(problems))
        sys.exit(1)


if __name__ == "__main__":
    main()
