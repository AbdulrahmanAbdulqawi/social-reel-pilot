import { supabase } from "@/integrations/supabase/client";

export interface GetLateProfile {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
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
 * List all GetLate profiles
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

/** Get the most recently created GetLate profile */
export async function getLatestGetLateProfile(): Promise<GetLateProfile | null> {
  const profiles = await listGetLateProfiles();
  if (!profiles.length) return null;
  // Prefer sorting by createdAt if available, else take last
  const withDates = profiles.filter(p => !!(p as any).createdAt);
  if (withDates.length === profiles.length) {
    return profiles
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }
  return profiles[profiles.length - 1];
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
      .maybeSingle();

    if (profileError) throw profileError;

    return (profile as any)?.getlate_profile_id || null;
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
 * Ensures the current user has a GetLate profile, creating one if needed
 * Strategy: create -> fetch latest -> link
 */
export async function ensureUserHasGetLateProfile(): Promise<string | null> {
  // 1) Return if already linked
  let profileId = await getUserGetLateProfileId();
  if (profileId) return profileId;

  // 2) Try to create a new profile
  await createGetLateProfile();

  // 3) Fetch the latest profile and link it
  const latest = await getLatestGetLateProfile();
  if (!latest?._id) return null;

  const linked = await linkGetLateProfileToUser(latest._id);
  return linked ? latest._id : null;
}
