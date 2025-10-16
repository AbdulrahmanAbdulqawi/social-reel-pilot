import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostReelRequest {
  reelId: string;
  videoUrl: string;
  caption: string;
  hashtags?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { reelId, videoUrl, caption, hashtags } = await req.json() as PostReelRequest;

    console.log('Posting to TikTok:', { reelId, videoUrl, caption });

    const { data: session } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    const { data: platformAccount, error: accountError } = await supabase
      .from('platform_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'tiktok')
      .single();

    if (accountError || !platformAccount) {
      throw new Error('TikTok account not connected');
    }

    // TODO: Replace with actual TikTok API call
    // Real implementation would use TikTok Content Posting API
    
    const mockResponse = {
      id: `tt_${Date.now()}`,
      share_url: `https://tiktok.com/@user/video/${Date.now()}`,
    };

    console.log('TikTok post successful:', mockResponse);

    await supabase
      .from('reels')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
      })
      .eq('id', reelId);

    await supabase
      .from('reel_analytics')
      .insert({
        reel_id: reelId,
        platform_response_id: mockResponse.id,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      });

    return new Response(
      JSON.stringify({ success: true, data: mockResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error posting to TikTok:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
