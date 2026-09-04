-- Normalize usernames to lowercase (BUG-002). Fail if case-variant duplicates exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User"
    GROUP BY lower(username)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Case-variant duplicate usernames exist; resolve before migrating';
  END IF;
END $$;

UPDATE "User" SET username = lower(username) WHERE username <> lower(username);
