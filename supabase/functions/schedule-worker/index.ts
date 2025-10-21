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
    // Validate webhook secret for security
    const authHeader = req.headers.get('Authorization');
    const expectedSecret = Deno.env.get('SCHEDULE_WORKER_SECRET');
    
    if (!expectedSecret) {
      console.error('SCHEDULE_WORKER_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      console.error('Unauthorized schedule worker access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

        // Generate a JWT token for the user to authenticate the function call
        const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: '', // Not needed for token generation
          options: {
            data: { user_id: reel.user_id }
          }
        });

        // Create a temporary session token for this user
        const supabaseAnonUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabaseAnon = createClient(supabaseAnonUrl, supabaseAnonKey);
        
        // Sign in as the user to get a valid session token
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: `temp-${reel.user_id}@temp.com`,
          password: Math.random().toString(36),
          user_metadata: { temp: true },
          email_confirm: true
        });

        // Actually, better approach: use service role to directly call with user context
        // Call the appropriate platform function with service role authorization
        const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'x-user-id': reel.user_id, // Pass user ID in header
          },
          body: JSON.stringify({
            reelId: reel.id,
            videoUrl: reel.video_url,
            caption: reel.caption,
            hashtags: reel.hashtags,
            userId: reel.user_id, // Pass user ID in body as well
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Platform function returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const error = null;

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
