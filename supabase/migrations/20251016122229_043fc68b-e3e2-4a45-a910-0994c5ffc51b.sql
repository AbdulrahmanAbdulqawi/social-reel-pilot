-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the worker job to run every minute with authentication
-- The SCHEDULE_WORKER_SECRET will be passed as environment variable to the edge function
SELECT cron.schedule(
  'schedule-worker-job',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://tlvjvlogyirfatfoujrv.supabase.co/functions/v1/schedule-worker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SCHEDULE_WORKER_SECRET_PLACEHOLDER"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);