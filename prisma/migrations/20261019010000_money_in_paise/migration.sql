-- Store every money amount as integer paise, the unit Razorpay uses, instead of rupees.
-- Columns are renamed with a Paise suffix so the unit is explicit, and values are multiplied by 100.
-- Audit log metadata written before this migration keeps its amounts in rupees.

ALTER TABLE "MentorProfile" RENAME COLUMN "priceMin" TO "priceMinPaise";
ALTER TABLE "MentorProfile" RENAME COLUMN "priceMax" TO "priceMaxPaise";
ALTER TABLE "Session" RENAME COLUMN "price" TO "pricePaise";
ALTER TABLE "Session" RENAME COLUMN "platformCut" TO "platformCutPaise";
ALTER TABLE "Session" RENAME COLUMN "mentorEarning" TO "mentorEarningPaise";
ALTER TABLE "Payment" RENAME COLUMN "amount" TO "amountPaise";
ALTER TABLE "Payment" RENAME COLUMN "refundAmount" TO "refundAmountPaise";
ALTER TABLE "Payout" RENAME COLUMN "amount" TO "amountPaise";

UPDATE "MentorProfile" SET "priceMinPaise" = "priceMinPaise" * 100, "priceMaxPaise" = "priceMaxPaise" * 100;
UPDATE "Session" SET "pricePaise" = "pricePaise" * 100, "platformCutPaise" = "platformCutPaise" * 100, "mentorEarningPaise" = "mentorEarningPaise" * 100;
UPDATE "Payment" SET "amountPaise" = "amountPaise" * 100, "refundAmountPaise" = "refundAmountPaise" * 100;
UPDATE "Payout" SET "amountPaise" = "amountPaise" * 100;

-- These copies of the session amounts duplicated Session and are no longer written.
UPDATE "Payment" SET "metadata" = "metadata" - 'platformCut' - 'mentorEarning'
WHERE "metadata" IS NOT NULL AND jsonb_typeof("metadata") = 'object';
