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
 * Finds a free GetLate profile that isn't linked to any user
 */
async function findFreeGetLateProfile(): Promise<string | null> {
  try {
    // Get all GetLate profiles
    const allProfiles = await listGetLateProfiles();
    if (!allProfiles.length) return null;

    // Get all linked profile IDs from our database
    const { data: linkedProfiles, error } = await supabase
      .from('profiles')
      .select('getlate_profile_id')
      .not('getlate_profile_id', 'is', null);

    if (error) throw error;

    const linkedIds = new Set(linkedProfiles?.map(p => p.getlate_profile_id) || []);

    // Find the first profile that isn't linked
    const freeProfile = allProfiles.find(profile => !linkedIds.has(profile._id));
    return freeProfile?._id || null;
  } catch (error) {
    console.error('Error finding free GetLate profile:', error);
    return null;
  }
}

/**
 * Checks if a free GetLate profile is available (not used for signup validation)
 */
export async function checkFreeProfileAvailability(): Promise<boolean> {
  const freeProfileId = await findFreeGetLateProfile();
  return freeProfileId !== null;
}

/**
 * Ensures the current user has a GetLate profile
 * Strategy: check if user has profile -> find free profile -> FAIL if none available
 */
export async function ensureUserHasGetLateProfile(): Promise<string | null> {
  // 1) Return if already linked
  let profileId = await getUserGetLateProfileId();
  if (profileId) return profileId;

  // 2) Try to find a free profile first
  const freeProfileId = await findFreeGetLateProfile();
  if (freeProfileId) {
    const linked = await linkGetLateProfileToUser(freeProfileId);
    return linked ? freeProfileId : null;
  }

  // 3) No free profiles available - DO NOT create new one
  return null;
}
