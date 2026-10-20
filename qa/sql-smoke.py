#!/usr/bin/env python3
"""Extracts every SQL text block from the Java sources and runs it against a migrated PostgreSQL with all parameters NULL.
It cannot prove the logic, but it catches what the Java compiler cannot: syntax errors, unknown columns / tables / functions
and bad casts. Integrity errors (class 23) are expected with NULL parameters and are accepted.
Usage: PGHOST=... PGUSER=... PGDATABASE=<migrated db> python3 qa/sql-smoke.py"""
import glob, re, sys
import psycopg2

BLOCK = re.compile(r'"""\n(.*?)"""', re.S)
PARAM = re.compile(r'(?<![:\w]):([A-Za-z_]\w*)')
SQLISH = re.compile(r'^\s*(SELECT|INSERT|UPDATE|DELETE|WITH)\b', re.I)

def course_json(staff: bool) -> str:
    # mirrors CatalogController.courseJson (kept in sync by reading the Java text blocks)
    src = open('services/api/src/main/java/sa/gba/academy/catalog/CatalogController.java').read()
    start = src.index('private static String courseJson')
    blocks = BLOCK.findall(src[start:start + 6000])
    modules_sql, blocks = blocks[0], blocks[1:]
    s_extra = ",'joinUrl',s.join_url,'meetingProvider',s.meeting_provider" if staff else ""
    c_extra = ",'status',c.status,'reviewNote',c.review_note,'submittedAt',c.submitted_at,'quizzes',c.quizzes" if staff else ""
    sql = blocks[0] + c_extra + blocks[1] + s_extra + blocks[2]
    return sql.replace('@MODULES@', 'c.modules' if staff else modules_sql).replace('@MATERIALS@', 'c.materials' if staff else "'[]'::jsonb")

def main():
    conn = psycopg2.connect("")
    conn.autocommit = True
    cur = conn.cursor()
    ok = bad = 0
    tests = []
    for f in sorted(glob.glob('services/api/src/main/java/**/*.java', recursive=True)):
        for m in BLOCK.finditer(open(f).read()):
            sql = m.group(1)
            if SQLISH.match(sql.strip()): tests.append((f.split('/')[-1], sql))
    for staff in (False, True):
        tests.append((f'courseJson(staff={staff})', 'SELECT ' + course_json(staff) + ' FROM courses c'))
    # statements assembled from several string pieces in Java
    tests += [
        ('promo quote lock', "SELECT id, percent_off, max_uses, used_count, active, (expires_at IS NOT NULL AND expires_at < now()) AS expired FROM promo_codes WHERE code = :c FOR UPDATE"),
        ('promo redeem', "UPDATE promo_codes SET used_count = used_count + 1 WHERE id = :id AND (max_uses IS NULL OR used_count < max_uses)"),
        ('roles any', "SELECT count(*) FROM users WHERE id = :id AND roles && string_to_array(:r, ',')"),
        ('enrollment content', "SELECT modules::text AS modules, quizzes::text AS quizzes, materials::text AS materials FROM courses WHERE slug = :s"),
        ('banner insert', "INSERT INTO banners(title, subtitle, cta_label, link_url, image_url, theme, starts_at, ends_at, active, sort_order) VALUES (:t::jsonb, :s::jsonb, :c::jsonb, :l, :i, :th, :st::timestamptz, :en::timestamptz, :a, :o)"),
        ('quiz guard', "SELECT count(*) FROM courses WHERE slug = :s AND jsonb_exists(quizzes, :l)"),
        ('cancel removed', "SELECT meeting_ref FROM live_sessions WHERE offering_id = :o AND meeting_provider = 'google_meet' AND meeting_ref IS NOT NULL AND id <> ALL(string_to_array(:ids, ','))"),
        ('delete removed', "DELETE FROM live_sessions WHERE offering_id = :o AND id <> ALL(string_to_array(:ids, ','))"),
        ('pending sort', "SELECT " + course_json(True) + " FROM courses c ORDER BY (c.status = 'pending') DESC, c.audience, c.title ->> 'ar'"),
    ]
    for name, sql in tests:
        q = PARAM.sub('NULL', sql)
        try:
            cur.execute('BEGIN'); cur.execute(q); cur.execute('ROLLBACK'); ok += 1
        except psycopg2.Error as e:
            cur.execute('ROLLBACK') if conn.status else None
            code = e.pgcode or ''
            if code.startswith('23') or code in ('22004', '22P02', '22007', '22008'):
                ok += 1                      # integrity or NULL-data errors are expected here
            else:
                bad += 1
                print(f'FAIL {name} [{code}] {str(e).strip().splitlines()[0]}\n----\n{q[:600]}\n')
    print(f'{ok} statements OK, {bad} failed, {len(tests)} checked')
    sys.exit(1 if bad else 0)

main()
