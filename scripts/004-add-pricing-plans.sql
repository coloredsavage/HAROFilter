-- Add pricing plan columns to profiles table

-- Add plan and keyword_limit columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS keyword_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMPTZ;

-- Update existing users to have default values
UPDATE profiles
SET plan = 'free',
    keyword_limit = 5
WHERE plan IS NULL;

-- Create index for faster plan queries
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- Add comment for documentation
COMMENT ON COLUMN profiles.plan IS 'User subscription plan: free (5 keywords) or pro (unlimited keywords)';
COMMENT ON COLUMN profiles.keyword_limit IS 'Maximum number of keywords user can add based on their plan (999999 = unlimited for pro)';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for payment tracking';
COMMENT ON COLUMN profiles.stripe_payment_intent_id IS 'Stripe payment intent ID for the upgrade transaction';
COMMENT ON COLUMN profiles.upgraded_at IS 'Timestamp when user upgraded to pro plan';

-- Row Level Security policies remain the same (users can only see their own data)
