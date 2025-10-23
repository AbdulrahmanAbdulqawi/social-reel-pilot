import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GETLATE_API_URL = 'https://getlate.dev/api/v1';

interface PostRequest {
  reelId: string;
  mediaItems?: Array<{ type: string; url: string }>;
  title: string;
  caption?: string;
  hashtags?: string[];
  platforms: Array<{ platform: string; accountId: string }>;
  scheduledFor?: string;
  timezone?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const getlateApiKey = Deno.env.get('GETLATE_API_KEY') || Deno.env.get('Late_API_KEY') || Deno.env.get('LATE_API_KEY');
    console.log('GetLate API key present (post):', !!getlateApiKey);
    if (!getlateApiKey) {
      throw new Error('GetLate API key not configured');
    }

    const postData: PostRequest = await req.json();
    console.log('GetLate Post Request:', postData);

    // Build the content with caption and hashtags
    let content = postData.title;
    if (postData.caption) {
      content += `\n\n${postData.caption}`;
    }
    if (postData.hashtags && postData.hashtags.length > 0) {
      content += `\n\n${postData.hashtags.map(tag => `#${tag}`).join(' ')}`;
    }

    // Build platforms array with platform-specific settings
    const platforms = postData.platforms.map(({ platform, accountId }) => {
      const platformSpecificData: any = {};
      
      switch (platform.toLowerCase()) {
        case 'instagram':
          // Determine content type based on media
          if (postData.mediaItems && postData.mediaItems.length > 0) {
            const hasVideo = postData.mediaItems.some(m => m.type === 'video');
            platformSpecificData.contentType = hasVideo ? 'reel' : 'post';
          } else {
            platformSpecificData.contentType = 'post'; // text only
          }
          break;
        case 'tiktok':
          platformSpecificData.tiktokSettings = {
            privacy_level: 'PUBLIC_TO_EVERYONE',
            allow_comment: true,
            allow_duet: true,
            allow_stitch: true,
          };
          break;
        case 'youtube':
          platformSpecificData.contentType = 'short';
          platformSpecificData.visibility = 'public';
          break;
      }

      return {
        platform: platform.toLowerCase(),
        accountId,
        platformSpecificData,
      };
    });

    // Build the post request body
    const requestBody: any = {
      content,
      platforms,
      mediaItems: postData.mediaItems && postData.mediaItems.length > 0 
        ? postData.mediaItems
        : [], // Empty array for text-only posts
    };

    // Add scheduling if provided
    if (postData.scheduledFor) {
      requestBody.scheduledFor = postData.scheduledFor;
      requestBody.timezone = postData.timezone || 'UTC';
    } else {
      requestBody.publishNow = true;
    }

    console.log('Sending to GetLate:', JSON.stringify(requestBody, null, 2));

    // Post to GetLate
    const response = await fetch(`${GETLATE_API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getlateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('GetLate API Error:', responseData);
      throw new Error(`GetLate API error: ${responseData.error || response.statusText}`);
    }

    console.log('GetLate Post Success:', responseData);

    // Update the reel with the GetLate post ID
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseClient
      .from('reels')
      .update({
        getlate_post_id: responseData.post?._id,
        posting_method: 'getlate',
        status: postData.scheduledFor ? 'scheduled' : 'posted',
      })
      .eq('id', postData.reelId);

    if (updateError) {
      console.error('Failed to update reel with GetLate post ID:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      postId: responseData.post?._id,
      platformPostUrl: responseData.post?.platforms?.[0]?.platformPostUrl,
      data: responseData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('GetLate Post Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
