#!/usr/bin/env bash
# Applies every Flyway migration to a throwaway PostgreSQL database and runs integrity scenarios.
# Usage: PGHOST=localhost PGPORT=5432 PGUSER=postgres ./scripts/db-check.sh      (CI runs this against a postgres service)
set -euo pipefail
cd "$(dirname "$0")/.."
DB="gba_check_$$"
psql -v ON_ERROR_STOP=1 -qc "CREATE DATABASE $DB" postgres
trap 'psql -qc "DROP DATABASE IF EXISTS $DB" postgres >/dev/null 2>&1 || true' EXIT
for f in $(ls services/api/src/main/resources/db/migration/V*.sql | sort -V); do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f" >/dev/null
  echo "applied $(basename "$f")"
done
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f qa/db-scenarios.sql
# Every SQL statement written in the Java code is parsed by PostgreSQL (catches typos the Java compiler cannot see).
if python3 -c "import psycopg2" 2>/dev/null; then
  PGDATABASE="$DB" python3 qa/sql-smoke.py
else
  echo "db-check: skipped qa/sql-smoke.py (pip install psycopg2-binary to enable)"
fi
echo "db-check: all scenarios passed"
