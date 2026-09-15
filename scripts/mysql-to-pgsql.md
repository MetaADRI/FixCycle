# MySQL to PostgreSQL dump / transform / restore

Strategy per mega prompt Section 2.3: prefer a schema dump + data migration
script over a big-bang rewrite of every migration file. This documents the
procedure. It is NOT run as part of Phase 1 (Phase 1 only needs a blank
PostgreSQL schema via `php artisan migrate`). Re-evaluate timings with the owner
before running the destructive production cutover.

## 0. Preconditions

- PostgreSQL 13+ reachable, an empty database created (e.g. `fixcycle`).
- Laravel `.env` switched to `DB_CONNECTION=pgsql`, `DB_PORT=5432`.
- `config/database.php` pgsql block confirmed: `charset=utf8`, `sslmode=prefer`,
  `schema=public`.
- Review `database/pgsql/postgresql-migration-notes.md` for the SQL patterns
  that differ.

## 1. Recommended tooling

- `pgloader` (best for live MySQL->PostgreSQL migration, handles type mapping
  and most SQL transforms automatically).
  `pgloader mysql://user@host/fixcycle postgresql://user@127.0.0.1/fixcycle`
- Exclude or filter `sessions`, `jobs`, `failed_jobs`, `cache`, and log tables
  — they are disposable and will cause the most type friction.
- For schema-only control: `mysqldump --no-data` then a converter
  (`chale/i2p`, `pglobals`, or manual edits per the notes file).

## 2. Dump (MySQL side)

```bash
mysqldump -u USER -p --single-transaction --no-tablespaces \
  --skip-lock-tables --no-data --routines --triggers fixcycle \
  > schema_mysql.sql

mysqldump -u USER -p --single-transaction --no-tablespaces \
  --skip-lock-tables --no-create-info --quick --skip-extended-insert \
  fixcycle \
  > data_mysql.sql
```

## 3. Transform

- Run the MySQL-only pattern hunt from
  `database/pgsql/postgresql-migration-notes.md` (backticks, unsigned, enum,
  json, GROUP BY, tinyint booleans, `ON UPDATE CURRENT_TIMESTAMP`, fulltext,
  `LIMIT a,b`, date functions).
- Prefer `pgloader` for automatic mapping; use manual edits only for the
  leftovers pgloader cannot handle.
- Normalize `0/1` flags to PostgreSQL booleans or keep `smallint` for columns
  that still read as numbers in API responses. Do not change Eloquent casts.

## 4. Restore (PostgreSQL side)

```bash
psql -U USER -d fixcycle -v ON_ERROR_STOP=1 -f schema_pgsql.sql
psql -U USER -d fixcycle -v ON_ERROR_STOP=1 -f data_pgsql.sql
pgloader data_mysql.sql postgresql://USER@127.0.0.1/fixcycle  # alternative
```

## 5. Verify

```bash
php artisan migrate:status            # should show run migrations
php artisan migrate                    # fills any gaps with correct file order
php artisan db:seed --class=...        # seeds compatible with pgsql
php artisan tinker --execute="echo App\\Models\\Merchant::count();"
```

Sanity checklist after restore:

- Merchant rows, segments, service types, home-screen holders present.
- A user login (OTP + on-board) returns the same envelope as MySQL.
- `POST /api/user/configuration` returns theme and flags.
- `POST /api/user/main-screen` with lat/lng returns home cells.
- Fulltext search features (if any) are re-checked against the notes file.

## 6. Rollback

- PostgreSQL is additive: keep MySQL alive as the parallel truth until UAT.
- Point `DB_CONNECTION=mysql` back in `.env`, re-run `php artisan migrate`
  against the old database if a migration added pgsql-only files, and test.

## Known phase-1 scope

- Phase 1 runs `php artisan migrate` against a BLANK PostgreSQL database only.
- No destructive change is made to the production MySQL instance.
- Every rewritten migration file is logged in
  `database/pgsql/postgresql-migration-notes.md`.