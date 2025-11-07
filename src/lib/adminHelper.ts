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

  if (error) {
    console.error('Admin invoke error:', { error, data });
    
    // The error message is in the FunctionsHttpError context
    // We need to fetch it from the response
    throw error;
  }
  
  // Check if response contains an error field
  if (data?.error) {
    throw new Error(data.error);
  }
  
  return data;
}
