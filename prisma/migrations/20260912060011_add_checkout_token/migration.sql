-- Step 1:
-- Add checkoutToken as nullable so existing orders remain valid.
-- IF NOT EXISTS also makes this safe if the failed migration
-- managed to create the column before stopping.

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "checkoutToken" TEXT;


-- Step 2:
-- Give every existing order its own checkout token.

UPDATE "orders"
SET "checkoutToken" = gen_random_uuid()::text
WHERE "checkoutToken" IS NULL;


-- Step 3:
-- Now every existing row has a value, so it is safe
-- to make the column required.

ALTER TABLE "orders"
ALTER COLUMN "checkoutToken" SET NOT NULL;


-- Step 4:
-- Match Prisma's @unique constraint.

CREATE UNIQUE INDEX IF NOT EXISTS "orders_checkoutToken_key"
ON "orders"("checkoutToken");