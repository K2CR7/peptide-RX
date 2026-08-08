-- Wellness-goal picker removed: nutrition guidance now shows every category
-- for every user instead of a user-selected subset.
ALTER TABLE "User" DROP COLUMN "wellnessGoals";
