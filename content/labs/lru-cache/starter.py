from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity, ttl_seconds, clock):
        self.capacity = capacity
        self.ttl = ttl_seconds
        self.clock = clock
        self.hits = 0
        self.misses = 0
        # TODO

    def get(self, key):
        # TODO
        return None

    def set(self, key, value):
        # TODO
        pass

    def get_or_load(self, key, loader):
        # TODO
        return loader()
