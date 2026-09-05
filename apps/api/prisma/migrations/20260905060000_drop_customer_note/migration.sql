-- BUG-022: drop leftover Customer.note (tblPerson.Note). Care notes keep their own note.
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "note";
