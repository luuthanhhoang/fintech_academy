"""Print the flattened PDF outline (bookmarks) as JSON: [{"title": ..., "page": N}] in document order, 1-based pages."""
import json
import sys

from pypdf import PdfReader


def walk(reader, items, out):
    for it in items:
        if isinstance(it, list):
            walk(reader, it, out)
        else:
            out.append({"title": it.title, "page": reader.get_destination_page_number(it) + 1})


reader = PdfReader(sys.argv[1])
out = []
walk(reader, reader.outline, out)
print(json.dumps(out, ensure_ascii=False))
