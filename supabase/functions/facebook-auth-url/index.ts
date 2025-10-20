const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StartAuthBody {
  redirectUri: string;
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

    const { redirectUri } = (await req.json()) as StartAuthBody;

    const metaAppId = Deno.env.get('META_APP_ID');
    if (!metaAppId) {
      throw new Error('Meta App ID not configured');
    }
    if (!redirectUri) {
      throw new Error('Missing redirectUri');
    }

    console.log('Facebook Auth Request:', { redirectUri, appIdLength: metaAppId.length });

    // Generate random CSRF state token for security
    const csrfState = Math.random().toString(36).substring(2);

    const params = new URLSearchParams({
      client_id: metaAppId,
      redirect_uri: redirectUri,
      scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,business_management',
      response_type: 'code',
      state: csrfState,
    });

    const url = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    
    console.log('Generated Facebook Auth URL:', url);

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('facebook-auth-url error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
