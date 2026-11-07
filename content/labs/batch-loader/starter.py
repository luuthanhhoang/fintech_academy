class BatchLoader:
    def __init__(self, batch_fn):
        self.batch_fn = batch_fn
        # TODO

    def load(self, key):
        # TODO
        raise NotImplementedError

    def dispatch(self):
        # TODO
        raise NotImplementedError


def naive_load_customers(db, orders):
    # TODO
    raise NotImplementedError
