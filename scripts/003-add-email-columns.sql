-- Migration 003: Add email integration columns and tables
-- This migration adds support for HARO email ingestion, processing, and notifications

-- Step 1: Add email metadata columns to queries table
ALTER TABLE queries
ADD COLUMN IF NOT EXISTS haro_email_id TEXT,
ADD COLUMN IF NOT EXISTS haro_category TEXT,
ADD COLUMN IF NOT EXISTS source_email_received_at TIMESTAMPTZ;

-- Create index on haro_email_id for duplicate detection
CREATE INDEX IF NOT EXISTS idx_queries_haro_email_id ON queries(haro_email_id);

-- Step 2: Create email_notifications tracking table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_match', 'daily_digest', 'urgent')),
  query_ids UUID[] NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for email_notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);

-- Step 3: Create haro_processing_logs for debugging and monitoring
CREATE TABLE IF NOT EXISTS haro_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('received', 'parsed', 'stored', 'matched', 'notified', 'failed')),
  queries_extracted INTEGER DEFAULT 0,
  users_notified INTEGER DEFAULT 0,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for haro_processing_logs
CREATE INDEX IF NOT EXISTS idx_haro_processing_logs_email_id ON haro_processing_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_haro_processing_logs_status ON haro_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_haro_processing_logs_created_at ON haro_processing_logs(created_at);

-- Add RLS policies for email_notifications
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email notifications"
  ON email_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Add RLS policies for haro_processing_logs (admin only - no user access)
ALTER TABLE haro_processing_logs ENABLE ROW LEVEL SECURITY;

-- Grant appropriate permissions
GRANT SELECT ON email_notifications TO authenticated;
GRANT SELECT ON haro_processing_logs TO service_role;
