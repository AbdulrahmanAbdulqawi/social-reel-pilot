-- Unschedule the existing job
SELECT cron.unschedule('schedule-worker-job');

-- Schedule the cron job to call our helper function instead
-- The helper function will handle authentication internally
SELECT cron.schedule(
  'schedule-worker-job',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://tlvjvlogyirfatfoujrv.supabase.co/functions/v1/cron-trigger-schedule-worker',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);