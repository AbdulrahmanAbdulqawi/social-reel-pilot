// --- Config & CORS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const GETLATE_API_URL = 'https://getlate.dev/api/v1';

// --- Main Handler ---
Deno.serve(async (req) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Load API key (with fallback to multiple env vars)
    const getlateApiKey =
      Deno.env.get('GETLATE_API_KEY') ||
      Deno.env.get('Late_API_KEY') ||
      Deno.env.get('LATE_API_KEY');

    if (!getlateApiKey) {
      throw new Error('GetLate API key not configured in environment');
    }

    // Parse JSON body safely
    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        throw new Error('Invalid or missing JSON body');
      }
    }

    const { action, platform, profileId } = body || {};

    console.log('GetLate Request:', { method: req.method, action, platform, profileId });

    // --- Actions ---
    switch (action) {
      /**
       * 1️⃣ List all profiles
       */
      case 'list-profiles': {
        const res = await fetch(`${GETLATE_API_URL}/profiles`, {
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to list profiles: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        return jsonResponse(data);
      }

      /**
       * 2️⃣ Create a new profile
       */
      case 'create-profile': {
        const payload = {
          name: 'Social Reel Pilot',
          description: 'Automated social media posting',
          color: '#4ade80',
        };

        const res = await fetch(`${GETLATE_API_URL}/profiles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed to create profile: ${res.status} ${res.statusText} - ${errText}`);
        }

        const data = await res.json();
        return jsonResponse(data);
      }

      /**
       * 3️⃣ Get Connect URL for a platform
       */
      case 'get-connect-url': {
        if (!platform || !profileId) {
          throw new Error('Both "platform" and "profileId" are required for connect URL');
        }

        // Build optional redirect URL to settings page
        const referer = req.headers.get('origin') || req.headers.get('referer') || '';
        let settingsUrl = '';
        if (referer) {
          try {
            const u = new URL(referer);
            settingsUrl = `${u.origin}/settings`;
          } catch (_) {
            console.warn('Invalid referer URL, skipping redirect');
          }
        }

        const connectBase = `${GETLATE_API_URL}/connect/${encodeURIComponent(platform.toLowerCase())}?profileId=${encodeURIComponent(profileId)}`;
        const connectUrl = settingsUrl
          ? `${connectBase}&redirect_url=${encodeURIComponent(settingsUrl)}`
          : connectBase;

        const res = await fetch(connectUrl, {
          redirect: 'manual',
          headers: { 'Authorization': `Bearer ${getlateApiKey}` },
        });

        if (!res.ok && res.status !== 302) {
          const errText = await res.text();
          throw new Error(`Failed to get connect URL: ${res.status} ${res.statusText} - ${errText}`);
        }

        // Extract redirect URL
        const authUrl = res.headers.get('location') || res.url;
        return jsonResponse({ url: authUrl });
      }

      /**
       * 4️⃣ List connected accounts for a profile
       */
      case 'list-accounts': {
        if (!profileId) {
          throw new Error('"profileId" is required to list accounts');
        }

        const res = await fetch(`${GETLATE_API_URL}/accounts?profileId=${encodeURIComponent(profileId)}`, {
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed to list accounts: ${res.status} ${res.statusText} - ${errText}`);
        }

        const data = await res.json();
        return jsonResponse(data);
      }

      /**
       * 🚫 Default: Unknown action
       */
      default:
        return jsonError(`Unknown or missing action: ${action}`, 400);
    }
  } catch (error) {
    console.error('❌ GetLate API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return jsonError(message, 500);
  }
});

// --- Helpers ---
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
