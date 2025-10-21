-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create cron job to trigger schedule worker every minute
-- This will check for scheduled reels and post them at their scheduled time
SELECT cron.schedule(
  'trigger-schedule-worker',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://tlvjvlogyirfatfoujrv.supabase.co/functions/v1/cron-trigger-schedule-worker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdmp2bG9neWlyZmF0Zm91anJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTM2MTYsImV4cCI6MjA3NjE2OTYxNn0.ZQGZECAzyZC0seEh5TDz1eZTLYes8zuiEOyl0ffnMWY"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);