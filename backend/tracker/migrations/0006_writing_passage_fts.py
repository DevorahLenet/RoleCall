"""Full-text search over writing passages, via SQLite's built-in FTS5.

Hand-written, unlike every other migration here, because Django has no FTS5
support: the virtual table and the triggers that keep it in step have to be raw
SQL. It is a separate migration from 0005 because an external-content FTS5
table references a real table that must already exist.

Design notes:

* `content='tracker_writingpassage'` makes this an EXTERNAL CONTENT index — the
  passage text is not duplicated, FTS5 reads it back out of the real table.
  The price is that FTS5 cannot see writes on its own, hence the triggers.
* `tokenize='porter unicode61'` is what makes "fundraising" match a search for
  "fundraiser", and "churn" match "churning". Stemming covers word forms, not
  concepts — synonyms remain the known gap.
* The delete/update triggers use FTS5's special 'delete' command, which needs
  the OLD text to remove the right terms from the index.

Because the triggers live in the database, every write path stays in sync for
free: the ORM, `sync_passages()`, bulk deletes and the admin alike.
"""

from django.db import migrations

CREATE = """
CREATE VIRTUAL TABLE writing_passage_fts USING fts5(
    text,
    content='tracker_writingpassage',
    content_rowid='id',
    tokenize='porter unicode61'
);

CREATE TRIGGER writing_passage_fts_ai AFTER INSERT ON tracker_writingpassage BEGIN
    INSERT INTO writing_passage_fts(rowid, text) VALUES (new.id, new.text);
END;

CREATE TRIGGER writing_passage_fts_ad AFTER DELETE ON tracker_writingpassage BEGIN
    INSERT INTO writing_passage_fts(writing_passage_fts, rowid, text)
    VALUES ('delete', old.id, old.text);
END;

CREATE TRIGGER writing_passage_fts_au AFTER UPDATE ON tracker_writingpassage BEGIN
    INSERT INTO writing_passage_fts(writing_passage_fts, rowid, text)
    VALUES ('delete', old.id, old.text);
    INSERT INTO writing_passage_fts(rowid, text) VALUES (new.id, new.text);
END;
"""

DROP = """
DROP TRIGGER IF EXISTS writing_passage_fts_au;
DROP TRIGGER IF EXISTS writing_passage_fts_ad;
DROP TRIGGER IF EXISTS writing_passage_fts_ai;
DROP TABLE IF EXISTS writing_passage_fts;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("tracker", "0005_writingpiece_writingpassage_and_more"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE, reverse_sql=DROP),
    ]
