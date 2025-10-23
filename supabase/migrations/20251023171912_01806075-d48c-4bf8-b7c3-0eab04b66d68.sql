-- Add column to track GetLate post IDs
ALTER TABLE public.reels 
ADD COLUMN IF NOT EXISTS getlate_post_id TEXT,
ADD COLUMN IF NOT EXISTS posting_method TEXT DEFAULT 'getlate' CHECK (posting_method IN ('getlate', 'direct'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reels_getlate_post_id ON public.reels(getlate_post_id);

-- Update existing scheduled reels to use getlate method
UPDATE public.reels 
SET posting_method = 'getlate' 
WHERE status = 'scheduled' AND posting_method IS NULL;