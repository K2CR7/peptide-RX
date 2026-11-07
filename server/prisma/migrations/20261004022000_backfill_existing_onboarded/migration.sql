-- Accounts that already existed before onboarding shipped have obviously
-- already "started" — dropping them into a first-run survey would be a
-- regression, not a feature. Stamp them as done, using the account's own
-- creation time rather than now() so the record stays truthful.
--
-- Scoped to rows created before this migration, so genuinely new sign-ups
-- after it still get the full flow.
UPDATE "User"
SET "onboardedAt" = "createdAt",
    "tourCompletedAt" = "createdAt"
WHERE "onboardedAt" IS NULL;
