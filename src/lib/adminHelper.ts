import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user has admin role
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;

    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Invoke admin panel edge function
 */
export async function adminInvoke(action: string, body: any = {}) {
  const { data, error } = await supabase.functions.invoke('admin-panel', {
    body: { action, ...body }
  });

  console.log('Admin invoke response:', { action, data, error });

  if (error) {
    console.error('Admin invoke HTTP error:', error);
    throw error;
  }
  
  // Check if response contains an error field (for 200 responses with errors)
  if (data?.error) {
    console.error('Admin invoke returned error in body:', data.error);
    throw new Error(data.error);
  }
  
  // Also check for success: false
  if (data?.success === false && data?.error) {
    console.error('Admin invoke failed:', data.error);
    throw new Error(data.error);
  }
  
  return data;
}
