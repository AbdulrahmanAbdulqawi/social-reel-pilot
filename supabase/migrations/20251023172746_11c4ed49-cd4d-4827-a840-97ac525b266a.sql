-- Add support for multiple platforms and media types
ALTER TABLE reels 
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('video', 'image', 'text', 'mixed')),
  ADD COLUMN IF NOT EXISTS media_items jsonb DEFAULT '[]'::jsonb;

-- Update existing records to use new format
UPDATE reels 
SET 
  platforms = ARRAY[platform::text],
  media_type = 'video',
  media_items = jsonb_build_array(
    jsonb_build_object(
      'type', 'video',
      'url', video_url
    )
  )
WHERE platforms IS NULL OR array_length(platforms, 1) IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_reels_platforms ON reels USING GIN(platforms);
CREATE INDEX IF NOT EXISTS idx_reels_media_type ON reels(media_type);

-- Add comment for documentation
COMMENT ON COLUMN reels.platforms IS 'Array of platforms this reel is posted to (instagram, tiktok, youtube)';
COMMENT ON COLUMN reels.media_type IS 'Type of media: video, image, text, or mixed';
COMMENT ON COLUMN reels.media_items IS 'Array of media objects with type and url';