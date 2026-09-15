# PostgreSQL migration notes

Target: `DB_CONNECTION=pgsql` (already configured in `config/database.php` with
`charset=utf8`, `sslmode=prefer`). The repository ships ~615 migrations written
against MySQL. This file lists the MySQL-only SQL patterns to hunt while running
`php artisan migrate` on a blank PostgreSQL database, or during a dump/restore.

Rule from the mega prompt: keep Eloquent models unchanged unless a query is
PostgreSQL-illegal. Rewrite only the individual migration files that cannot run
on PostgreSQL, and log every change here.

## 1. Backticks in raw SQL

MySQL accepts `` `table` `` and `` `column` `` quoting. PostgreSQL uses double
quotes and expands unquoted identifiers to lowercase.

- Searches: `` ` `` (backtick) in `database/migrations/`, `app/`, `routes/`.
- Fix: replace `` `name` `` with `"name"` in raw SQL statements, or prefer the
  query builder so quoting is handled for you.

## 2. `UNSIGNED` and column types

MySQL's `integer unsigned`, `bigint unsigned`, `tinyint unsigned` do not exist
in PostgreSQL.

- Searches: `unsigned` in migrations.
- Fix: plain `integer`/`bigint`. PostgreSQL `serial`/`bigserial` can replace
  MySQL `auto_increment`. Constraint checks are enforced server-side in
  PostgreSQL, so a `CHECK (col >= 0)` may be worth adding when the column is
  semantically non-negative (id columns, counts).

## 3. `enum`

MySQL has a native `enum('a','b')` type. PostgreSQL uses `text` + `CHECK` or an
actual enum type.

- Searches: `->enum(`, `->set(` in migrations.
- Fix (small-scale): `->enum('status', [...])` -> `->string('status', 32)` with
  a check constraint, or a native Postgres `enum` type. Eloquent casts are
  unaffected because values stay strings.

## 4. `json` columns and querying

MySQL `json` and PostgreSQL `jsonb` behave differently:

- Searches: `->json(`, `->jsonb(`, `json_contains(`, `->` operators, `JSON_`
  functions in queries.
- PostgreSQL: use `jsonb` and the `->`, `->>`, `@>`, `?` operators. MySQL
  `JSON_CONTAINS(col, '"x"' )` maps to `col @> '"x"'::jsonb` in PostgreSQL.
- Add GiN/GiST indexes for jsonb containment queries (`->index()` is not enough;
  use `CREATE INDEX ... USING GIN (col jsonb_path_ops)`).

## 5. `GROUP BY` and `only_full_group_by`

MySQL (with `strict=false` here) tolerates selecting non-aggregated columns that
are not in `GROUP BY`. PostgreSQL does not.

- Searches: `groupBy(`, `->groupby(`, `group by` in raw SQL.
- Fix: add every non-aggregated selected column to `GROUP BY`, or use
  `ANY_VALUE(col)` style workarounds. In Eloquent, add the extra columns to
  `->groupBy([...])`.

## 6. Auto-increment and `LAST_INSERT_ID()`

- Searches: `LAST_INSERT_ID(`, `auto_increment`.
- Fix: PostgreSQL returns ids via `RETURNING id`; Eloquent inserts do this
  automatically and return the created model. Raw statements need
  `INSERT ... RETURNING id`.

## 7. `ON DUPLICATE KEY UPDATE` / `INSERT IGNORE`

- Searches: `ON DUPLICATE`, `INSERT IGNORE`, `insertOrIgnore`, `updateOrCreate`.
- Fix: `ON CONFLICT (unique_col) DO UPDATE SET ...` / `ON CONFLICT DO NOTHING`.

## 8. Boolean `0/1`

MySQL treats `0`/`1` as false/true and stores booleans as `tinyint(1)`.
PostgreSQL booleans are real `boolean` and reject integer literals on strict
inserts.

- Searches: smallint/tinyint columns used as flags, `->boolean(` with integer
  defaults, bindings that pass `0`/`1`.
- Fix: keep `->boolean()` in new code so PDO maps to native boolean; convert
  stored `0`/`1` data with `CAST(x AS boolean)` during migration.

## 9. `ON UPDATE CURRENT_TIMESTAMP`

MySQL sets a timestamp automatically on update. PostgreSQL has no equivalent
column attribute.

- Searches: `ON UPDATE CURRENT_TIMESTAMP`, `useCurrentOnUpdate`.
- Fix: rely on Laravel's `$table->timestamps()` refresh pattern (Eloquent emits
  `updated_at` explicitly), or add a trigger for raw updates:
  `CREATE TRIGGER ... BEFORE UPDATE ... SET updated_at = now()`.

## 10. Fulltext indexes

MySQL `FULLTEXT` requires the InnoDB table engine (engine is null here).
PostgreSQL fulltext search uses `tsvector` + `GIN` indexes.

- Searches: `fulltext`, `FULLTEXT`, `match ... against`, `AMInnoDB`, `engine`.
- Fix: `MATCH(col) AGAINST (...)`, which does not exist in PostgreSQL. Add
  generated `tsvector` columns and use `to_tsvector`/`to_tsquery`, or keep
  `LIKE`/`ILIKE` for simple substring search. Fulltext Cairo-style Arabic
  indexing may need `pg_trgm` for ILIKE acceleration.

## 11. `STRICT` mode differences

MySQL `strict=false` coerces bad values. PostgreSQL aborts the whole statement
on a constraint or type error. Wrapped transactions are safer:
`DB::transaction(function () { ... })`.

## 12. LIMIT syntax

`LIMIT x, y` (MySQL offset form) is invalid.

- Searches: `->skip(`, `->offset(`, `LIMIT \d+ *[,]`.
- Fix: use `->offset(x)->limit(y)`.

## 13. Date functions

- Searches: `DATE_FORMAT(`, `NOW() + INTERVAL`, `CURDATE()`, `IFNULL`, `IF(`,
  `GROUP_CONCAT(`.
- Fix:
  - `DATE_FORMAT` -> `to_char(col, 'YYYY-MM-DD')`
  - `NOW() + INTERVAL n DAY` -> `NOW() + interval 'n days'`
  - `CURDATE()` -> `CURRENT_DATE`
  - `IFNULL(a, b)` -> `COALESCE(a, b)` (already portable)
  - `IF(c, a, b)` -> `CASE WHEN c THEN a ELSE b END`
  - `GROUP_CONCAT` -> `string_agg(col, ',')`

## 14. Charset / collation leaks

- Searches: `charset`, `collation`, `utf8mb4` inside migrations.
- Fix: drop explicit charset/collation from column definitions; use the
  connection-level `charset=utf8` and database default collation.

## Change log

Record every migration file rewritten for PostgreSQL here, with the change made.

| Date | Migration / file | Problem | Fix |
|------|------------------|---------|-----|
|      |                  |         |     |