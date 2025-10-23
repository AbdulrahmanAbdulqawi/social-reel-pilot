import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GETLATE_API_URL = 'https://getlate.dev/api/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const getlateApiKey = Deno.env.get('GETLATE_API_KEY') || Deno.env.get('Late_API_KEY') || Deno.env.get('LATE_API_KEY');
    if (!getlateApiKey) {
      throw new Error('GetLate API key not configured');
    }

    const { postId } = await req.json();
    console.log('Fetching analytics for post:', postId);

    // Fetch post details with analytics from GetLate
    const response = await fetch(`${GETLATE_API_URL}/posts/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getlateApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GetLate API Error:', errorData);
      throw new Error(`GetLate API error: ${errorData.error || response.statusText}`);
    }

    const postData = await response.json();
    console.log('GetLate analytics data:', postData);

    // Extract analytics from the response
    const analytics = postData.post?.analytics || {};
    const platforms = postData.post?.platforms || [];

    // Update local database with latest analytics
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find reel by getlate_post_id
    const { data: reel } = await supabaseClient
      .from('reels')
      .select('id')
      .eq('getlate_post_id', postId)
      .single();

    if (reel) {
      // Check if analytics record exists
      const { data: existing } = await supabaseClient
        .from('reel_analytics')
        .select('id')
        .eq('reel_id', reel.id)
        .eq('platform_response_id', postId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabaseClient
          .from('reel_analytics')
          .update({
            views: analytics.views || 0,
            likes: analytics.likes || 0,
            comments: analytics.comments || 0,
            shares: analytics.shares || 0,
            fetched_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating analytics:', updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabaseClient
          .from('reel_analytics')
          .insert({
            reel_id: reel.id,
            views: analytics.views || 0,
            likes: analytics.likes || 0,
            comments: analytics.comments || 0,
            shares: analytics.shares || 0,
            platform_response_id: postId,
            fetched_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error inserting analytics:', insertError);
        } else {
          console.log('Analytics inserted successfully for reel:', reel.id);
        }
      }
    } else {
      console.warn('Reel not found for getlate_post_id:', postId);
    }

    return new Response(JSON.stringify({
      success: true,
      analytics,
      platforms,
      postData: postData.post,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('GetLate Analytics Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
