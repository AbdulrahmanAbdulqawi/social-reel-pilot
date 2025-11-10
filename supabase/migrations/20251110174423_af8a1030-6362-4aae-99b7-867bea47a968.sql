-- Add recurring_pattern column to reels table for recurring post logic
ALTER TABLE public.reels 
ADD COLUMN IF NOT EXISTS recurring_pattern jsonb,
ADD COLUMN IF NOT EXISTS parent_post_id uuid REFERENCES public.reels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_recurring_instance boolean DEFAULT false;

-- Add timezone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Create index for parent_post_id lookups
CREATE INDEX IF NOT EXISTS idx_reels_parent_post_id ON public.reels(parent_post_id);

-- Create index for recurring instances
CREATE INDEX IF NOT EXISTS idx_reels_recurring ON public.reels(is_recurring_instance) WHERE is_recurring_instance = true;

-- Add comment to explain recurring_pattern structure
COMMENT ON COLUMN public.reels.recurring_pattern IS 'JSON structure: {
  "frequency": "daily|weekly|monthly",
  "interval": 1,
  "daysOfWeek": [0-6],
  "endDate": "ISO date",
  "occurrences": number,
  "timezone": "timezone string"
}';