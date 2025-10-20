import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { encrypt } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { platform, code, userId, redirectUri } = await req.json();

    console.log('OAuth callback for platform:', platform);

    // Get user
    const { data: session } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (!session?.user || session.user.id !== userId) {
      throw new Error('Unauthorized');
    }

    // Exchange code for tokens
    let tokenResponse: OAuthTokenResponse;
    
    if (platform === 'tiktok') {
      // TikTok token exchange
      const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
      const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
      
      if (!tiktokClientKey || !tiktokClientSecret) {
        throw new Error('TikTok credentials not configured');
      }

      const tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/';
      if (!redirectUri) {
        throw new Error('Missing redirectUri');
      }
      const tokenParams = new URLSearchParams({
        client_key: tiktokClientKey,
        client_secret: tiktokClientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const tokenRes = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      const tokenData = await tokenRes.json();
      
      if (tokenData.error || !tokenData.data) {
        console.error('TikTok token exchange error:', tokenData);
        throw new Error(tokenData.error_description || 'Failed to exchange code for token');
      }

      tokenResponse = {
        access_token: tokenData.data.access_token,
        refresh_token: tokenData.data.refresh_token,
        expires_in: tokenData.data.expires_in,
      };
    } else if (platform === 'instagram' || platform === 'facebook') {
      // Meta (Facebook/Instagram) token exchange
      const metaAppId = Deno.env.get('META_APP_ID');
      const metaAppSecret = Deno.env.get('META_APP_SECRET');
      
      if (!metaAppId || !metaAppSecret) {
        throw new Error('Meta credentials not configured');
      }

      if (!redirectUri) {
        throw new Error('Missing redirectUri');
      }

      const tokenEndpoint = 'https://graph.facebook.com/v21.0/oauth/access_token';
      const tokenParams = new URLSearchParams({
        client_id: metaAppId,
        client_secret: metaAppSecret,
        code: code,
        redirect_uri: redirectUri,
      });

      const tokenRes = await fetch(`${tokenEndpoint}?${tokenParams.toString()}`);
      const tokenData = await tokenRes.json();
      
      if (tokenData.error) {
        console.error('Meta token exchange error:', tokenData);
        throw new Error(tokenData.error.message || 'Failed to exchange code for token');
      }

      // Exchange short-lived token for long-lived token
      const longLivedParams = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: metaAppId,
        client_secret: metaAppSecret,
        fb_exchange_token: tokenData.access_token,
      });

      const longLivedRes = await fetch(`${tokenEndpoint}?${longLivedParams.toString()}`);
      const longLivedData = await longLivedRes.json();

      if (longLivedData.error) {
        console.error('Meta long-lived token error:', longLivedData);
        throw new Error(longLivedData.error.message || 'Failed to get long-lived token');
      }

      tokenResponse = {
        access_token: longLivedData.access_token,
        expires_in: longLivedData.expires_in,
      };
    } else {
      throw new Error(`OAuth not implemented for platform: ${platform}`);
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = await encrypt(tokenResponse.access_token);
    const encryptedRefreshToken = tokenResponse.refresh_token 
      ? await encrypt(tokenResponse.refresh_token)
      : null;

    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null;

    // Store encrypted tokens in database
    const { error: upsertError } = await supabase
      .from('platform_accounts')
      .upsert({
        user_id: userId,
        platform,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
      }, {
        onConflict: 'user_id,platform',
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ success: true, message: 'Platform connected successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
