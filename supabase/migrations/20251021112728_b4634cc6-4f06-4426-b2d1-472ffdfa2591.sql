-- Temporarily update failed reels back to scheduled status
UPDATE public.reels 
SET status = 'scheduled' 
WHERE status = 'failed' 
  AND scheduled_at IS NOT NULL;