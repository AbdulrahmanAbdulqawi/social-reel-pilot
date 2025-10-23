import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Youtube, Facebook } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface GetLateAccount {
  _id: string;
  platform: string;
  username: string;
  displayName: string;
  isActive: boolean;
  profileId: string;
}

interface GetLateProfile {
  _id: string;
  name: string;
  description?: string;
}

const Settings = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<GetLateAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(() => {
    // Load cached profile ID from localStorage
    return localStorage.getItem('getlate_profile_id');
  });
  const [initializingProfile, setInitializingProfile] = useState(false);

  useEffect(() => {
    // Check OAuth callback first
    handleOAuthCallback();
    
    // Initialize profile in background
    if (!profileId) {
      initializeGetLateProfile();
    } else {
      // If we have a cached profile ID, fetch accounts immediately
      fetchConnectedAccounts(profileId);
    }
  }, []);

  const initializeGetLateProfile = async () => {
    setInitializingProfile(true);
    try {
      // First, try to get existing profiles
      const { data: profilesData, error: profilesError } = await supabase.functions.invoke('getlate-connect', {
        body: { action: 'list-profiles' }
      });

      if (profilesError) throw profilesError;

      const profiles = profilesData?.profiles as GetLateProfile[] || [];
      
      if (profiles.length > 0) {
        // Use the first profile
        const profile = profiles[0];
        setProfileId(profile._id);
        localStorage.setItem('getlate_profile_id', profile._id);
        await fetchConnectedAccounts(profile._id);
      } else {
        // Create a new profile
        const { data: newProfileData, error: createError } = await supabase.functions.invoke('getlate-connect', {
          body: { action: 'create-profile' }
        });

        if (createError) throw createError;

        const newProfile = newProfileData?.profiles?.[0] as GetLateProfile;
        if (newProfile) {
          setProfileId(newProfile._id);
          localStorage.setItem('getlate_profile_id', newProfile._id);
          await fetchConnectedAccounts(newProfile._id);
        }
      }
    } catch (error) {
      console.error('Error initializing GetLate profile:', error);
      toast.error('Failed to initialize GetLate');
    } finally {
      setInitializingProfile(false);
      setLoading(false);
    }
  };

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const username = urlParams.get('username');
    
    if (connected) {
      toast.success(`${connected} connected successfully as @${username}!`);
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh accounts after a short delay to let GetLate process
      setTimeout(() => {
        if (profileId) {
          fetchConnectedAccounts(profileId);
        }
      }, 1000);
    }
  };

  const fetchConnectedAccounts = async (getlateProfileId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('getlate-connect', {
        body: {
          action: 'list-accounts',
          profileId: getlateProfileId
        }
      });

      if (error) throw error;
      setConnectedAccounts(data?.accounts || []);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      toast.error('Failed to load connected accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    if (!profileId) {
      toast.error('Profile not initialized');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('getlate-connect', {
        body: {
          action: 'get-connect-url',
          platform: platform.toLowerCase(),
          profileId
        }
      });

      if (error || !data?.url) {
        console.error('GetLate connect URL error:', error);
        toast.error(`Failed to start ${platform} connection`);
        return;
      }

      // Redirect to GetLate OAuth
      window.location.href = data.url;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast.error('Failed to connect platform');
    }
  };

  const isConnected = (platform: string) => {
    return connectedAccounts.some(
      acc => acc.platform.toLowerCase() === platform.toLowerCase() && acc.isActive
    );
  };

  const getAccountInfo = (platform: string) => {
    const account = connectedAccounts.find(
      acc => acc.platform.toLowerCase() === platform.toLowerCase() && acc.isActive
    );
    return account ? `@${account.username}` : null;
  };

  // Show page immediately, display loading state only when fetching accounts
  const isInitializing = initializingProfile && !profileId;

  const platforms = [
    {
      name: "Instagram",
      icon: Instagram,
      color: "text-pink-500",
      connected: isConnected('instagram'),
      accountInfo: getAccountInfo('instagram'),
    },
    {
      name: "TikTok",
      icon: () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      color: "text-foreground",
      connected: isConnected('tiktok'),
      accountInfo: getAccountInfo('tiktok'),
    },
    {
      name: "YouTube",
      icon: Youtube,
      color: "text-red-500",
      connected: isConnected('youtube'),
      accountInfo: getAccountInfo('youtube'),
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-600",
      connected: isConnected('facebook'),
      accountInfo: getAccountInfo('facebook'),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your connected social media platforms
        </p>
      </div>

      <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
          <CardDescription>
            Connect your social media accounts to start posting (powered by GetLate)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInitializing ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Setting up GetLate integration...</p>
            </div>
          ) : (
            platforms.map((platform, index) => {
              const Icon = platform.icon;
              return (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                >
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${platform.color}`} />
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    {platform.accountInfo && (
                      <p className="text-sm text-muted-foreground">{platform.accountInfo}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {platform.connected ? (
                    <>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                        Connected
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(platform.name)}
                        disabled={loading}
                      >
                        Reconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConnect(platform.name)}
                      disabled={loading || !profileId}
                    >
                      {loading ? "Loading..." : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
