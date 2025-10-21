import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { decrypt } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostReelRequest {
  reelId: string;
  videoUrl: string;
  caption: string;
  hashtags?: string[];
  userId?: string; // Optional: for background worker calls
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { reelId, videoUrl, caption, hashtags, userId } = await req.json() as PostReelRequest;

    console.log('Posting to Instagram:', { reelId, videoUrl, caption });

    // Determine user ID: either from request body (background worker) or from auth token (frontend)
    let authenticatedUserId: string;
    
    if (userId) {
      // Background worker call with userId provided
      authenticatedUserId = userId;
      console.log('Using provided userId for background post');
    } else {
      // Frontend call with user JWT token
      const { data: session } = await supabase.auth.getUser(
        req.headers.get('Authorization')?.replace('Bearer ', '') || ''
      );

      if (!session?.user) {
        throw new Error('Unauthorized');
      }
      
      authenticatedUserId = session.user.id;
    }

    const { data: platformAccount, error: accountError } = await supabase
      .from('platform_accounts')
      .select('*')
      .eq('user_id', authenticatedUserId)
      .eq('platform', 'instagram')
      .single();

    if (accountError || !platformAccount) {
      throw new Error('Instagram account not connected');
    }

    // Decrypt access token
    const accessToken = await decrypt(platformAccount.access_token);

    // Real Instagram Graph API implementation
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.instagram.com/v18.0/${accessToken}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: videoUrl,
          caption: `${caption}\n\n${(hashtags || []).join(' ')}`,
        }),
      }
    );

    if (!containerResponse.ok) {
      const error = await containerResponse.json();
      
      // Check if token is invalid or expired
      if (error?.error?.code === 190 || error?.error?.message?.includes('Invalid OAuth 2.0 Access Token')) {
        console.log('Instagram token expired, marking for reconnection');
        // Mark token as expired
        await supabase
          .from('platform_accounts')
          .update({ expires_at: new Date().toISOString() })
          .eq('user_id', authenticatedUserId)
          .eq('platform', 'instagram');
      }
      
      throw new Error(`Instagram container creation failed: ${JSON.stringify(error)}`);
    }

    const { id: containerId } = await containerResponse.json();

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.instagram.com/v18.0/${accessToken}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
        }),
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      
      // Check if token is invalid or expired
      if (error?.error?.code === 190 || error?.error?.message?.includes('Invalid OAuth 2.0 Access Token')) {
        console.log('Instagram token expired, marking for reconnection');
        // Mark token as expired
        await supabase
          .from('platform_accounts')
          .update({ expires_at: new Date().toISOString() })
          .eq('user_id', authenticatedUserId)
          .eq('platform', 'instagram');
      }
      
      throw new Error(`Instagram publish failed: ${JSON.stringify(error)}`);
    }

    const mockResponse = await publishResponse.json();

    console.log('Instagram post successful:', mockResponse);

    // Update reel status
    await supabase
      .from('reels')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
      })
      .eq('id', reelId);

    // Create analytics entry
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
    console.error('Error posting to Instagram:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
