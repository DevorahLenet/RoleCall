"""Passage search over the FTS5 index created in migration 0006.

Raw SQL rather than the ORM because the two things that make this feature work
— `snippet()` for the highlighted excerpt and `bm25()` for relevance — are FTS5
functions Django cannot express.
"""

from __future__ import annotations

import re
from datetime import datetime

from django.db import connection

# Wraps the matched terms inside an excerpt. Control characters rather than
# brackets or markup: a passage that itself contains "[" or "<b>" cannot
# corrupt the highlight, and the frontend splits on these to render <mark>
# without ever interpreting the text as HTML.
# Built from char codes rather than written literally: an invisible control
# character in source is one a stray editor or formatter can silently eat.
HIGHLIGHT_OPEN = chr(2)  # STX
HIGHLIGHT_CLOSE = chr(3)  # ETX

# No endpoint in this API paginates, so search caps itself rather than growing
# an envelope nothing else has. Nobody scrolls past fifty matching lines.
RESULT_LIMIT = 50

_SORTS = {
    "relevance": "rank",
    "used": "p.use_count DESC, rank",
    "recent": "wp.updated_at DESC, rank",
}


def to_match_query(raw: str) -> str | None:
    """Turn whatever the user typed into a safe FTS5 MATCH expression.

    This is not defensive tidying — raw input genuinely crashes FTS5. An
    apostrophe ("the team's roadmap"), a trailing operator ("donor OR") or an
    unbalanced quote each raise a syntax error, which without this would surface
    as a 500 from an ordinary search.

    So: take the word runs, quote each one, and let FTS5's implicit AND join
    them. The final term gets a `*` so results narrow as you type rather than
    appearing only once a word is finished.

    The trade-off is that boolean operators are treated as literal words. That
    is the right call for a search box — nobody types AND expecting FTS5
    grammar, and parsing it would hand the crash surface straight back.
    """
    terms = re.findall(r"\w+", raw, flags=re.UNICODE)
    if not terms:
        return None
    quoted = ['"{}"'.format(t.replace('"', '""')) for t in terms]
    quoted[-1] += "*"
    return " ".join(quoted)


def search_passages(
    raw_query: str,
    *,
    type_id: str | None = None,
    company: str | None = None,
    since: datetime | None = None,
    sort: str = "relevance",
) -> list[dict]:
    """Passages matching `raw_query`, most relevant first by default.

    Filters are the same ones the piece list uses, so narrowing by type,
    company or recency survives the switch from browsing documents to
    searching lines. Returns [] for a query with no searchable words rather
    than everything.
    """
    match = to_match_query(raw_query)
    if match is None:
        return []

    where = ["writing_passage_fts MATCH %s"]
    params: list[object] = [match]
    if type_id:
        where.append("wp.type = %s")
        params.append(type_id)
    if company:
        where.append("j.company = %s")
        params.append(company)
    if since:
        where.append("wp.updated_at >= %s")
        params.append(since)

    sql = f"""
        SELECT p.id, p.text, p.position, p.use_count,
               snippet(writing_passage_fts, 0, %s, %s, '…', 12) AS excerpt,
               wp.id, wp.title, wp.type,
               j.company,
               bm25(writing_passage_fts) AS rank
        FROM writing_passage_fts
        JOIN tracker_writingpassage p ON p.id = writing_passage_fts.rowid
        JOIN tracker_writingpiece wp ON wp.id = p.piece_id
        LEFT JOIN tracker_job j ON j.id = wp.job_id
        WHERE {" AND ".join(where)}
        ORDER BY {_SORTS.get(sort, _SORTS["relevance"])}
        LIMIT %s
    """
    query_params = [HIGHLIGHT_OPEN, HIGHLIGHT_CLOSE, *params, RESULT_LIMIT]

    with connection.cursor() as cursor:
        cursor.execute(sql, query_params)
        rows = cursor.fetchall()

    return [
        {
            "passage_id": row[0],
            "text": row[1],
            "position": row[2],
            "use_count": row[3],
            "excerpt": row[4],
            "piece": {"id": row[5], "title": row[6], "type": row[7]},
            "company": row[8],
        }
        for row in rows
    ]
