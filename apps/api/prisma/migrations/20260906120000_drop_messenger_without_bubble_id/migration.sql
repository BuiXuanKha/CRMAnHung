-- BUG-044: keep only Messenger bubble ids (mid.$… / …@msgr.…).
-- Images cascade via CustomerMessengerImage.messageId ON DELETE CASCADE.

DELETE FROM "CustomerMessengerMessage"
WHERE "externalMessageId" IS NULL
   OR btrim("externalMessageId") = ''
   OR NOT (
     "externalMessageId" ~* '^mid\.'
     OR "externalMessageId" ~* '^[0-9]+@msgr\.'
   );
