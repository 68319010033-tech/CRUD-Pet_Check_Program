-- Drop empty lowercase "users" table created by mistaken tableName config.
-- Existing app data lives in "Users" / "Profiles" / "Pets".

DROP TABLE IF EXISTS users CASCADE;

-- Ensure new auth columns exist on "Users" (safe if already present).
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;

UPDATE "Users"
SET role = COALESCE(role, 'user'),
    is_email_verified = COALESCE(is_email_verified, false),
    failed_login_attempts = COALESCE(failed_login_attempts, 0);

-- For local/dev convenience: mark existing users verified so login still works
UPDATE "Users" SET is_email_verified = true WHERE is_email_verified IS DISTINCT FROM true;
