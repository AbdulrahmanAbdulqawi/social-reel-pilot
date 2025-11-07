// --- Config & CORS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const GETLATE_API_URL = 'https://getlate.dev/api/v1';

// Import Supabase client
import { createClient } from 'jsr:@supabase/supabase-js@2';

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

    const { action, platform, profileId, userId } = body || {};

    console.log('GetLate Request:', { method: req.method, action, platform, profileId, userId });

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

        console.log('Calling GetLate connect URL:', connectUrl);

        const res = await fetch(connectUrl, {
          redirect: 'follow', // Follow redirects automatically
          headers: { 
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('GetLate response status:', res.status, res.statusText);
        const responseText = await res.text();
        console.log('GetLate response body:', responseText);

        if (!res.ok) {
          console.error('GetLate error response:', responseText);
          throw new Error(`Failed to get connect URL: ${res.status} ${res.statusText} - ${responseText}`);
        }

        // Check if response is JSON with a URL
        let authUrl: string;
        try {
          const jsonData = JSON.parse(responseText);
          if (jsonData.url) {
            authUrl = jsonData.url;
          } else if (jsonData.authUrl) {
            authUrl = jsonData.authUrl;
          } else {
            // If no URL in JSON, use the final URL after redirects
            authUrl = res.url;
          }
        } catch {
          // If not JSON, use the final URL after redirects
          authUrl = res.url;
        }

        console.log('Final auth URL:', authUrl);
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
       * 5️⃣ Disconnect an account
       */
      case 'disconnect-account': {
        const { accountId } = body;
        
        if (!accountId) {
          throw new Error('"accountId" is required to disconnect an account');
        }

        const res = await fetch(`${GETLATE_API_URL}/accounts/${encodeURIComponent(accountId)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed to disconnect account: ${res.status} ${res.statusText} - ${errText}`);
        }

        return jsonResponse({ success: true, message: 'Account disconnected successfully' });
      }

      /**
       * 6️⃣ Get usage stats
       */
      case 'get-usage-stats': {
        const res = await fetch(`${GETLATE_API_URL}/usage-stats`, {
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed to get usage stats: ${res.status} ${res.statusText} - ${errText}`);
        }

        const data = await res.json();
        return jsonResponse(data);
      }

      /**
       * 7️⃣ Claim a profile for a user (with smart logic)
       */
      case 'claim-profile': {
        if (!userId) {
          throw new Error('"userId" is required to claim a profile');
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Step 1: Check if user already has a profile linked
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('getlate_profile_id')
          .eq('id', userId)
          .single();

        if (existingProfile?.getlate_profile_id) {
          return jsonResponse({ 
            success: true, 
            profileId: existingProfile.getlate_profile_id,
            message: 'Profile already linked'
          });
        }

        // Step 2: Get all GetLate profiles
        const profilesRes = await fetch(`${GETLATE_API_URL}/profiles`, {
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profilesRes.ok) {
          throw new Error('Failed to fetch GetLate profiles');
        }

        const profilesData = await profilesRes.json();
        const allProfiles = profilesData.profiles || [];

        // Step 3: Get all linked profile IDs from Supabase
        const { data: linkedProfiles } = await supabase
          .from('profiles')
          .select('getlate_profile_id')
          .not('getlate_profile_id', 'is', null);

        const linkedIds = new Set(linkedProfiles?.map(p => p.getlate_profile_id) || []);

        // Step 4: Find a free profile
        const freeProfile = allProfiles.find((profile: any) => !linkedIds.has(profile._id));

        if (freeProfile) {
          // Try to link it (with race condition check)
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ getlate_profile_id: freeProfile._id })
            .eq('id', userId)
            .is('getlate_profile_id', null); // Only update if still null

          if (updateError) {
            console.error('Failed to link free profile:', updateError);
            throw new Error('Failed to link profile. Please try again.');
          }

          // Verify the update succeeded
          const { data: verifyProfile } = await supabase
            .from('profiles')
            .select('getlate_profile_id')
            .eq('id', userId)
            .single();

          if (verifyProfile?.getlate_profile_id === freeProfile._id) {
            return jsonResponse({ 
              success: true, 
              profileId: freeProfile._id,
              message: 'Free profile claimed successfully'
            });
          } else {
            // Race condition occurred, retry
            throw new Error('Profile was claimed by another user. Please try again.');
          }
        }

        // Step 5: No free profiles, check if we can create a new one
        const usageRes = await fetch(`${GETLATE_API_URL}/usage-stats`, {
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!usageRes.ok) {
          throw new Error('Failed to check usage stats');
        }

        const usageData = await usageRes.json();
        const canCreate = usageData.canCreateProfile || 
                         (usageData.usage?.profiles < usageData.limits?.profiles);

        if (!canCreate) {
          return jsonResponse({ 
            success: false, 
            error: 'no_access',
            message: "You don't have access to claim a new profile. Please contact customer support for help."
          }, 403);
        }

        // Step 6: Create a new profile
        const createPayload = {
          name: 'Social Reel Pilot',
          description: 'Automated social media posting',
          color: '#4ade80',
        };

        const createRes = await fetch(`${GETLATE_API_URL}/profiles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createPayload),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          throw new Error(`Failed to create profile: ${createRes.status} - ${errText}`);
        }

        const newProfileData = await createRes.json();
        const newProfileId = newProfileData._id || newProfileData.profile?._id;

        if (!newProfileId) {
          throw new Error('Created profile but no ID returned');
        }

        // Step 7: Link the new profile to the user
        const { error: linkError } = await supabase
          .from('profiles')
          .update({ getlate_profile_id: newProfileId })
          .eq('id', userId)
          .is('getlate_profile_id', null);

        if (linkError) {
          console.error('Failed to link new profile:', linkError);
          throw new Error('Failed to link newly created profile');
        }

        return jsonResponse({ 
          success: true, 
          profileId: newProfileId,
          message: 'New profile created and linked successfully'
        });
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
