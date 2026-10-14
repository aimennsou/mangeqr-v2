-- Runs ONCE, only when the data directory is first initialized (empty volume).
-- Enables Postgres extensions the app benefits from.
--
-- pgcrypto: provides gen_random_uuid(). The Prisma schema generates UUIDs in
-- the application layer (@default(uuid())), so this is not strictly required,
-- but having it available is harmless and useful for ad-hoc SQL / future
-- database-side defaults.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- citext: case-insensitive text, handy if you ever move email uniqueness into
-- the database. Optional but cheap to have.
CREATE EXTENSION IF NOT EXISTS "citext";
