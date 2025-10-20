const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StartAuthBody {
  redirectUri: string;
  isSandbox?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { redirectUri, isSandbox } = (await req.json()) as StartAuthBody;

    const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    if (!tiktokClientKey) {
      throw new Error('TikTok client key not configured');
    }
    if (!redirectUri) {
      throw new Error('Missing redirectUri');
    }

    console.log('TikTok Auth Request:', { redirectUri, isSandbox, clientKeyLength: tiktokClientKey.length });

    // Generate random CSRF state token for security
    const csrfState = Math.random().toString(36).substring(2);

    const params = new URLSearchParams({
      client_key: tiktokClientKey,
      scope: 'user.info.basic,video.publish',
      response_type: 'code',
      redirect_uri: redirectUri,
      state: csrfState,
    });

    const url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    
    console.log('Generated TikTok Auth URL (sandbox mode:', isSandbox, '):', url);

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('tiktok-auth-url error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});