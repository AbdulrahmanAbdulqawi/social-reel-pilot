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
    console.log('GetLate API key present:', !!getlateApiKey);
    if (!getlateApiKey) {
      throw new Error('GetLate API key not configured');
    }

    const { action, platform, profileId } = await req.json();

    console.log('GetLate Connect Request:', { action, platform, profileId });

    // Handle different actions
    switch (action) {
      case 'list-profiles': {
        const response = await fetch(`${GETLATE_API_URL}/profiles`, {
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list profiles: ${response.statusText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create-profile': {
        const response = await fetch(`${GETLATE_API_URL}/profiles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Social Reel Pilot',
            description: 'Automated social media posting',
            color: '#4ade80'
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create profile: ${errorText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-connect-url': {
        if (!platform || !profileId) {
          throw new Error('Platform and profileId required for connect URL');
        }

        // Try to build a redirect back to app settings (optional)
        const referer = req.headers.get('origin') || req.headers.get('referer') || '';
        let settingsUrl = '';
        if (referer) {
          try {
            const u = new URL(referer);
            settingsUrl = `${u.origin}/settings`;
          } catch (_) {}
        }

        const baseUrl = `${GETLATE_API_URL}/connect/${platform.toLowerCase()}?profileId=${profileId}`;
        const connectUrl = settingsUrl ? `${baseUrl}&redirect_url=${encodeURIComponent(settingsUrl)}` : baseUrl;

        const response = await fetch(connectUrl, {
          redirect: 'manual',
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get connect URL: ${errorText}`);
        }

        // GetLate returns a redirect response with Location header
        const authUrl = response.headers.get('location') || response.url;
        
        return new Response(JSON.stringify({ url: authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list-accounts': {
        if (!profileId) {
          throw new Error('ProfileId required for listing accounts');
        }

        const response = await fetch(
          `${GETLATE_API_URL}/accounts?profileId=${profileId}`,
          {
            headers: {
              'Authorization': `Bearer ${getlateApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to list accounts: ${response.statusText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('GetLate Connect Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
