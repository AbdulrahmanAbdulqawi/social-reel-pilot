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

    const { platform, code, userId } = await req.json();

    console.log('OAuth callback for platform:', platform);

    // Get user
    const { data: session } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (!session?.user || session.user.id !== userId) {
      throw new Error('Unauthorized');
    }

    // Exchange code for tokens (platform-specific implementation needed)
    let tokenResponse: OAuthTokenResponse;
    
    // This is a placeholder - actual implementation would exchange the code
    // for tokens using the platform's OAuth endpoint
    tokenResponse = {
      access_token: code, // In reality, this would be the result of token exchange
      refresh_token: undefined,
      expires_in: 3600,
    };

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
