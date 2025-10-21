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

    console.log('Instagram Auth Request:', { redirectUri, appIdLength: metaAppId.length });

    // Generate random CSRF state token for security
    const csrfState = Math.random().toString(36).substring(2);

    // Use Facebook Login for Instagram API with Instagram Login (Business Login)
    const params = new URLSearchParams({
      client_id: metaAppId,
      redirect_uri: redirectUri,
      scope: 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement',
      response_type: 'code',
      state: csrfState,
    });

    const url = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    
    console.log('Generated Instagram Auth URL:', url);

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('instagram-auth-url error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
