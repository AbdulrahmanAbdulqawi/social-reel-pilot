-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a cron job to run the schedule-worker every minute
SELECT cron.schedule(
  'process-scheduled-reels',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://tlvjvlogyirfatfoujrv.supabase.co/functions/v1/schedule-worker',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdmp2bG9neWlyZmF0Zm91anJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTM2MTYsImV4cCI6MjA3NjE2OTYxNn0.ZQGZECAzyZC0seEh5TDz1eZTLYes8zuiEOyl0ffnMWY"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) AS request_id;
  $$
);