-- Ensures MenuItemSuggestedItem table exists (run before app start on deploy)
-- Idempotent - safe to run every deploy
CREATE TABLE IF NOT EXISTS "MenuItemSuggestedItem" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "suggestedItemId" TEXT NOT NULL,
    CONSTRAINT "MenuItemSuggestedItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MenuItemSuggestedItem_menuItemId_suggestedItemId_key" ON "MenuItemSuggestedItem"("menuItemId", "suggestedItemId");
CREATE INDEX IF NOT EXISTS "MenuItemSuggestedItem_menuItemId_idx" ON "MenuItemSuggestedItem"("menuItemId");
CREATE INDEX IF NOT EXISTS "MenuItemSuggestedItem_suggestedItemId_idx" ON "MenuItemSuggestedItem"("suggestedItemId");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MenuItemSuggestedItem_menuItemId_fkey') THEN
    ALTER TABLE "MenuItemSuggestedItem" ADD CONSTRAINT "MenuItemSuggestedItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MenuItemSuggestedItem_suggestedItemId_fkey') THEN
    ALTER TABLE "MenuItemSuggestedItem" ADD CONSTRAINT "MenuItemSuggestedItem_suggestedItemId_fkey" FOREIGN KEY ("suggestedItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
