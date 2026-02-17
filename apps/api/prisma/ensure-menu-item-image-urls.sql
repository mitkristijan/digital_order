-- Ensures MenuItem.imageUrls column exists (run before app start on deploy)
-- Idempotent - safe to run every deploy
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT '{}';
