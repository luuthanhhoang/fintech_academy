class BatchLoader:
    def __init__(self, batch_fn):
        self.batch_fn = batch_fn
        self._cache = {}
        self._pending = []

    def load(self, key):
        if key not in self._cache and key not in self._pending:
            self._pending.append(key)
        return lambda: self._cache.get(key)

    def dispatch(self):
        todo = [k for k in self._pending if k not in self._cache]
        self._pending = []
        if not todo:
            return
        result = self.batch_fn(todo)
        for k in todo:
            self._cache[k] = result.get(k)


def naive_load_customers(db, orders):
    return [db.query([o["customer_id"]]).get(o["customer_id"]) for o in orders]
