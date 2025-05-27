-- This is a manual migration to ensure all required columns exist in the User table
-- It uses IF NOT EXISTS to avoid errors if columns already exist

-- Add isVerified column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- Add totalCreditsUsed column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalCreditsUsed" INTEGER NOT NULL DEFAULT 0;

-- Add maxMonthlyCredits column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "maxMonthlyCredits" INTEGER NOT NULL DEFAULT 0;

-- Add max_download column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "max_download" INTEGER NOT NULL DEFAULT 0;

-- Add totalDownloads column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalDownloads" INTEGER NOT NULL DEFAULT 0;

-- Add isSuspended column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;

-- Add credits column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "credits" INTEGER NOT NULL DEFAULT 0;
