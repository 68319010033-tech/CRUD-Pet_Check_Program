-- Fix role column type conflict so sequelize.sync({ alter: true }) can succeed.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'role' AND data_type = 'character varying'
  ) THEN
    UPDATE "Users" SET role = 'user' WHERE role IS NULL OR role NOT IN ('user', 'admin');

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
      CREATE TYPE "enum_Users_role" AS ENUM ('user', 'admin');
    END IF;

    ALTER TABLE "Users"
      ALTER COLUMN role DROP DEFAULT,
      ALTER COLUMN role TYPE "enum_Users_role"
        USING (
          CASE
            WHEN role IN ('user', 'admin') THEN role::"enum_Users_role"
            ELSE 'user'::"enum_Users_role"
          END
        ),
      ALTER COLUMN role SET DEFAULT 'user'::"enum_Users_role",
      ALTER COLUMN role SET NOT NULL;
  END IF;
END $$;
