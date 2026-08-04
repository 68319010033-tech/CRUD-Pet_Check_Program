SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

SELECT COUNT(*) AS users_lower FROM users;
SELECT COUNT(*) AS users_pascal FROM "Users";
SELECT id, user_id, display_name FROM "Profiles";
SELECT id, email FROM "Users";

SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'Profiles';
