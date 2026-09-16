-- Add password storage for the development-only admin credentials provider.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
