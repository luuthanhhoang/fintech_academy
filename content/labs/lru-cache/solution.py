from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity, ttl_seconds, clock):
        self.capacity = capacity
        self.ttl = ttl_seconds
        self.clock = clock
        self.hits = 0
        self.misses = 0
        self._data = OrderedDict()

    def get(self, key):
        item = self._data.get(key)
        if item is not None:
            value, written = item
            if self.clock() - written < self.ttl:
                self._data.move_to_end(key)
                self.hits += 1
                return value
            del self._data[key]
        self.misses += 1
        return None

    def set(self, key, value):
        self._data[key] = (value, self.clock())
        self._data.move_to_end(key)
        while len(self._data) > self.capacity:
            self._data.popitem(last=False)

    def get_or_load(self, key, loader):
        value = self.get(key)
        if value is None:
            value = loader()
            self.set(key, value)
        return value
