import { createClient } from 'jsr:@supabase/supabase-js@2';

// Admin Panel Edge Function - Protected admin-only operations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const GETLATE_API_URL = 'https://getlate.dev/api/v1';

// Verify admin role
async function verifyAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin'
  });
  
  if (error) {
    console.error('Error verifying admin role:', error);
    return false;
  }
  
  return data === true;
}

// Log admin action
async function logAdminAction(
  supabase: any,
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
) {
  await supabase.from('audit_logs').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError('Unauthorized', 401);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonError('Unauthorized', 401);
    }

    // Verify admin role
    const isAdmin = await verifyAdmin(supabase, user.id);
    if (!isAdmin) {
      return jsonError('Forbidden: Admin access required', 403);
    }

    const getlateApiKey = Deno.env.get('GETLATE_API_KEY');
    if (!getlateApiKey) {
      throw new Error('GetLate API key not configured');
    }

    const body = await req.json();
    const { action } = body;

    console.log('Admin action:', action, 'by:', user.email);

    switch (action) {
      // ===== USERS MANAGEMENT =====
      case 'list-users': {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get subscriptions and roles separately
        const enrichedProfiles = await Promise.all(
          profiles.map(async (profile: any) => {
            const { data: subscription } = await supabase
              .from('user_subscriptions')
              .select('*')
              .eq('user_id', profile.id)
              .single();

            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id);

            return {
              ...profile,
              user_subscriptions: subscription || null,
              user_roles: roles || []
            };
          })
        );

        await logAdminAction(supabase, user.id, 'list_users', 'user');
        return jsonResponse({ users: enrichedProfiles });
      }

      case 'update-user': {
        const { userId, updates } = body;
        if (!userId || !updates) {
          return jsonError('userId and updates required', 400);
        }

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (error) throw error;

        await logAdminAction(supabase, user.id, 'update_user', 'user', userId, updates);
        return jsonResponse({ success: true, message: 'User updated successfully' });
      }

      case 'suspend-user': {
        const { userId, suspend } = body;
        if (!userId) {
          return jsonError('userId required', 400);
        }

        // You could add a 'suspended' column to profiles table
        // For now, we'll use the audit log
        await logAdminAction(supabase, user.id, suspend ? 'suspend_user' : 'unsuspend_user', 'user', userId);
        return jsonResponse({ success: true, message: `User ${suspend ? 'suspended' : 'unsuspended'}` });
      }

      case 'assign-role': {
        const { userId, role } = body;
        if (!userId || !role) {
          return jsonError('userId and role required', 400);
        }

        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role, created_by: user.id });

        if (error) throw error;

        await logAdminAction(supabase, user.id, 'assign_role', 'user', userId, { role });
        return jsonResponse({ success: true, message: 'Role assigned successfully' });
      }

      case 'remove-role': {
        const { userId, role } = body;
        if (!userId || !role) {
          return jsonError('userId and role required', 400);
        }

        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;

        await logAdminAction(supabase, user.id, 'remove_role', 'user', userId, { role });
        return jsonResponse({ success: true, message: 'Role removed successfully' });
      }

      // ===== PROFILES MANAGEMENT =====
      case 'list-all-profiles': {
        // Get profiles from Supabase
        const { data: supabaseProfiles, error: sbError } = await supabase
          .from('profiles')
          .select('id, email, username, getlate_profile_id, created_at');

        if (sbError) throw sbError;

        // Get profiles from GetLate
        const getlateRes = await fetch(`${GETLATE_API_URL}/profiles`, {
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        let getlateProfiles = [];
        if (getlateRes.ok) {
          const data = await getlateRes.json();
          getlateProfiles = data.profiles || [];
        }

        // Get accounts for each profile
        const profilesWithAccounts = await Promise.all(
          getlateProfiles.map(async (profile: any) => {
            const accountsRes = await fetch(
              `${GETLATE_API_URL}/accounts?profileId=${encodeURIComponent(profile._id)}`,
              {
                headers: {
                  'Authorization': `Bearer ${getlateApiKey}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            let accounts = [];
            if (accountsRes.ok) {
              const accountsData = await accountsRes.json();
              accounts = accountsData.accounts || [];
            }

            // Find linked user
            const linkedUser = supabaseProfiles.find(
              (p: any) => p.getlate_profile_id === profile._id
            );

            return {
              ...profile,
              accounts,
              linkedUser: linkedUser ? {
                id: linkedUser.id,
                email: linkedUser.email,
                username: linkedUser.username
              } : null,
              status: linkedUser ? 'in_use' : 'free'
            };
          })
        );

        await logAdminAction(supabase, user.id, 'list_all_profiles', 'profile');
        return jsonResponse({ profiles: profilesWithAccounts });
      }

      case 'create-getlate-profile': {
        const { name, description, color } = body;

        const payload = {
          name: name || 'Social Reel Pilot',
          description: description || 'Created by admin',
          color: color || '#4ade80',
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
          throw new Error(`Failed to create profile: ${res.status} - ${errText}`);
        }

        const data = await res.json();
        await logAdminAction(supabase, user.id, 'create_getlate_profile', 'profile', data._id, payload);
        return jsonResponse({ success: true, profile: data });
      }

      case 'release-profile': {
        const { profileId, userId } = body;
        if (!profileId || !userId) {
          return jsonError('profileId and userId required', 400);
        }

        // Unlink profile from user
        const { error } = await supabase
          .from('profiles')
          .update({ getlate_profile_id: null })
          .eq('id', userId)
          .eq('getlate_profile_id', profileId);

        if (error) throw error;

        await logAdminAction(supabase, user.id, 'release_profile', 'profile', profileId, { userId });
        return jsonResponse({ success: true, message: 'Profile released successfully' });
      }

      case 'reassign-profile': {
        const { profileId, fromUserId, toUserId } = body;
        if (!profileId || !toUserId) {
          return jsonError('profileId and toUserId required', 400);
        }

        // Release from old user if specified
        if (fromUserId) {
          await supabase
            .from('profiles')
            .update({ getlate_profile_id: null })
            .eq('id', fromUserId);
        }

        // Assign to new user
        const { error } = await supabase
          .from('profiles')
          .update({ getlate_profile_id: profileId })
          .eq('id', toUserId);

        if (error) throw error;

        await logAdminAction(supabase, user.id, 'reassign_profile', 'profile', profileId, { fromUserId, toUserId });
        return jsonResponse({ success: true, message: 'Profile reassigned successfully' });
      }

      // ===== SUBSCRIPTIONS MANAGEMENT =====
      case 'list-subscriptions': {
        const { data: subscriptions, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich with profile data
        const enrichedSubscriptions = await Promise.all(
          subscriptions.map(async (subscription: any) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, username')
              .eq('id', subscription.user_id)
              .single();

            return {
              ...subscription,
              profiles: profile || null
            };
          })
        );

        await logAdminAction(supabase, user.id, 'list_subscriptions', 'subscription');
        return jsonResponse({ subscriptions: enrichedSubscriptions });
      }

      case 'update-subscription': {
        const { userId, planType, postsLimit } = body;
        if (!userId) {
          return jsonError('userId required', 400);
        }

        const updates: any = {};
        if (planType) updates.plan_type = planType;
        if (postsLimit !== undefined) updates.posts_limit = postsLimit;

        const { error } = await supabase
          .from('user_subscriptions')
          .update(updates)
          .eq('user_id', userId);

        if (error) throw error;

        await logAdminAction(supabase, user.id, 'update_subscription', 'subscription', userId, updates);
        return jsonResponse({ success: true, message: 'Subscription updated successfully' });
      }

      // ===== USAGE STATS =====
      case 'get-usage-stats': {
        const res = await fetch(`${GETLATE_API_URL}/usage-stats`, {
          headers: {
            'Authorization': `Bearer ${getlateApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to get usage stats');
        }

        const data = await res.json();

        // Get Supabase stats
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: linkedProfiles } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .not('getlate_profile_id', 'is', null);

        const { count: totalReels } = await supabase
          .from('reels')
          .select('*', { count: 'exact', head: true });

        await logAdminAction(supabase, user.id, 'get_usage_stats', 'stats');
        return jsonResponse({
          getlate: data,
          supabase: {
            totalUsers,
            linkedProfiles,
            freeProfiles: (data.usage?.profiles || 0) - (linkedProfiles || 0),
            totalReels
          }
        });
      }

      // ===== AUDIT LOGS =====
      case 'get-audit-logs': {
        const { limit = 100, offset = 0 } = body;

        const { data: logs, error } = await supabase
          .from('audit_logs')
          .select('*, profiles!audit_logs_admin_id_fkey(email, username)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return jsonResponse({ logs });
      }

      default:
        return jsonError(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('❌ Admin Panel Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return jsonError(message, 500);
  }
});

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
