import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Schedule worker running at:', new Date().toISOString());

    // Find all scheduled reels that are due to be posted
    const { data: dueReels, error: fetchError } = await supabase
      .from('reels')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${dueReels?.length || 0} reels to post`);

    const results = [];

    for (const reel of dueReels || []) {
      try {
        console.log(`Processing reel ${reel.id} for platform ${reel.platform}`);

        // Determine which platform function to call
        let functionName = '';
        switch (reel.platform) {
          case 'instagram':
            functionName = 'post-to-instagram';
            break;
          case 'tiktok':
            functionName = 'post-to-tiktok';
            break;
          case 'youtube':
            functionName = 'post-to-youtube';
            break;
          default:
            throw new Error(`Unknown platform: ${reel.platform}`);
        }

        // Get user's service role token to call the function
        const { data: userData } = await supabase.auth.admin.getUserById(reel.user_id);
        
        if (!userData?.user) {
          throw new Error('User not found');
        }

        // Call the appropriate platform function
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: {
            reelId: reel.id,
            videoUrl: reel.video_url,
            caption: reel.caption,
            hashtags: reel.hashtags,
          },
        });

        if (error) {
          throw error;
        }

        results.push({
          reelId: reel.id,
          platform: reel.platform,
          status: 'success',
          data,
        });

        console.log(`Successfully posted reel ${reel.id} to ${reel.platform}`);
      } catch (error) {
        console.error(`Failed to post reel ${reel.id}:`, error);

        // Mark reel as failed
        await supabase
          .from('reels')
          .update({
            status: 'failed',
          })
          .eq('id', reel.id);

        results.push({
          reelId: reel.id,
          platform: reel.platform,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Schedule worker error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
