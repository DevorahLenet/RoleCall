"""Splitting a writing piece's markdown body into reusable passages.

The unit of storage is a piece; the unit of *reuse* is a passage — you reach for
a bullet, not a whole resume. Passages are therefore derived, never authored:
asking the user to chunk their own writing is exactly the data-entry friction
that kills adoption (see ../../writing-library-plan.md).

This lives in its own module because two callers must chunk identically — the
model's save(), and the `seed_writing` command. If they ever diverged, seeded
pieces would search differently from authored ones.
"""

from __future__ import annotations

import re
import textwrap

# A markdown list item: -, *, + or an ordered "1." / "1)" marker.
_BULLET = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")
_HEADING = re.compile(r"^\s*#{1,6}\s+")

# Below this a "passage" is punctuation or a stray character, not something
# anyone would copy.
_MIN_LENGTH = 3


def split_passages(body: str) -> list[str]:
    """Split a markdown body into the passages a person would reuse.

    Blank lines separate blocks; inside a block, every list item is its own
    passage, with indented continuation lines kept attached to their bullet.
    Headings are dropped — "## Selected impact" is a label for the writing, not
    a piece of it.

    Chunk quality depends entirely on the body being real markdown. A piece
    pasted in as one unstructured blob yields one enormous passage, which
    silently degrades topic search — the feature the library exists for.
    """
    out: list[str] = []

    for block in re.split(r"\n\s*\n", body.replace("\r\n", "\n")):
        if not block.strip():
            continue
        lines = block.strip("\n").split("\n")

        if any(_BULLET.match(line) for line in lines):
            current: list[str] = []
            for line in lines:
                if _BULLET.match(line):
                    if current:
                        out.append("\n".join(current))
                    current = [line]
                elif current:
                    current.append(line)  # a continuation of the open bullet
                else:
                    out.append(line)  # a lead-in line sitting above the list
            if current:
                out.append("\n".join(current))
        else:
            out.append(block)

    cleaned: list[str] = []
    for passage in out:
        passage = textwrap.dedent(passage).strip()
        if not passage or _HEADING.match(passage) or len(passage) < _MIN_LENGTH:
            continue
        cleaned.append(passage)
    return cleaned
