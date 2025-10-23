import { supabase } from "@/integrations/supabase/client";

export interface GetLateProfile {
  _id: string;
  name: string;
  description?: string;
}

/**
 * Creates a new GetLate profile for the current user
 * @returns The created profile or null if failed
 */
export async function createGetLateProfile(): Promise<GetLateProfile | null> {
  try {
    const { data, error } = await supabase.functions.invoke('getlate-connect', {
      body: { action: 'create-profile' }
    });

    if (error) throw error;

    const profile = data?.profiles?.[0] as GetLateProfile;
    return profile || null;
  } catch (error) {
    console.error('Error creating GetLate profile:', error);
    return null;
  }
}

/**
 * Gets the GetLate profile ID for the current user from their Supabase profile
 * @returns The profile ID or null if not found
 */
export async function getUserGetLateProfileId(): Promise<string | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('getlate_profile_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return profile?.getlate_profile_id || null;
  } catch (error) {
    console.error('Error getting user GetLate profile ID:', error);
    return null;
  }
}

/**
 * Links a GetLate profile to the current user's Supabase profile
 * @param getlateProfileId The GetLate profile ID to link
 * @returns True if successful, false otherwise
 */
export async function linkGetLateProfileToUser(getlateProfileId: string): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ getlate_profile_id: getlateProfileId })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error linking GetLate profile to user:', error);
    return false;
  }
}

/**
 * Lists all GetLate profiles (mainly for debugging)
 * @returns Array of profiles or empty array if failed
 */
export async function listGetLateProfiles(): Promise<GetLateProfile[]> {
  try {
    const { data, error } = await supabase.functions.invoke('getlate-connect', {
      body: { action: 'list-profiles' }
    });

    if (error) throw error;

    return (data?.profiles as GetLateProfile[]) || [];
  } catch (error) {
    console.error('Error listing GetLate profiles:', error);
    return [];
  }
}

/**
 * Ensures the current user has a GetLate profile, creating one if needed
 * @returns The profile ID or null if failed
 */
export async function ensureUserHasGetLateProfile(): Promise<string | null> {
  // Check if user already has a profile ID
  let profileId = await getUserGetLateProfileId();
  
  if (profileId) {
    return profileId;
  }

  // Create a new profile
  const newProfile = await createGetLateProfile();
  if (!newProfile) {
    return null;
  }

  // Link it to the user
  const linked = await linkGetLateProfileToUser(newProfile._id);
  if (!linked) {
    return null;
  }

  return newProfile._id;
}
