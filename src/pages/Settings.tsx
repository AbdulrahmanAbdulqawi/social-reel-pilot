import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Youtube } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface PlatformAccount {
  id: string;
  platform: string;
  connected_at: string;
}

const Settings = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_accounts')
        .select('*');

      if (error) throw error;
      setConnectedAccounts(data || []);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      let authUrl = '';
      
      // Build OAuth URLs for each platform
      switch (platform.toLowerCase()) {
        case 'instagram':
          // Instagram OAuth requires Facebook App ID
          // https://developers.facebook.com/docs/instagram-basic-display-api/getting-started
          const instagramAppId = 'YOUR_INSTAGRAM_APP_ID'; // User needs to provide this
          const instagramRedirectUri = `${window.location.origin}/settings`;
          authUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&scope=user_profile,user_media&response_type=code`;
          toast.info('Instagram OAuth requires app setup. Check console for details.');
          console.log('Instagram OAuth URL:', authUrl);
          console.log('Steps: 1. Create Facebook App, 2. Add Instagram Basic Display, 3. Set redirect URI');
          break;
          
        case 'tiktok':
          // TikTok OAuth
          // https://developers.tiktok.com/doc/login-kit-web
          const tiktokClientKey = 'YOUR_TIKTOK_CLIENT_KEY'; // User needs to provide this
          const tiktokRedirectUri = `${window.location.origin}/settings`;
          authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${tiktokClientKey}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(tiktokRedirectUri)}`;
          toast.info('TikTok OAuth requires app setup. Check console for details.');
          console.log('TikTok OAuth URL:', authUrl);
          console.log('Steps: 1. Register app at developers.tiktok.com, 2. Get Client Key, 3. Set redirect URI');
          break;
          
        case 'youtube':
          // YouTube OAuth via Google
          // https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
          const googleClientId = 'YOUR_GOOGLE_CLIENT_ID'; // User needs to provide this
          const youtubeRedirectUri = `${window.location.origin}/settings`;
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(youtubeRedirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline`;
          toast.info('YouTube OAuth requires Google Cloud setup. Check console for details.');
          console.log('YouTube OAuth URL:', authUrl);
          console.log('Steps: 1. Create project in Google Cloud Console, 2. Enable YouTube Data API v3, 3. Create OAuth 2.0 credentials');
          break;
          
        default:
          toast.error('Unknown platform');
          return;
      }
      
      // In production, you would redirect to authUrl
      // window.location.href = authUrl;
      
      toast.info(`OAuth flow for ${platform} - Configure API credentials first`);
    } catch (error) {
      console.error('Error connecting platform:', error);
      toast.error('Failed to connect platform');
    }
  };

  const isConnected = (platformName: string) => {
    return connectedAccounts.some(
      acc => acc.platform.toLowerCase() === platformName.toLowerCase()
    );
  };

  const platforms = [
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-pink-500",
      connected: isConnected("instagram"),
    },
    {
      name: "TikTok",
      icon: () => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      ),
      color: "bg-black",
      connected: isConnected("tiktok"),
    },
    {
      name: "YouTube",
      icon: Youtube,
      color: "bg-red-500",
      connected: isConnected("youtube"),
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and connected platforms</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
          <CardDescription>
            Connect your social media accounts to enable auto-posting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 ${platform.color} rounded-lg text-white`}>
                  <platform.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {platform.connected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              {platform.connected ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-700">
                  Connected
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleConnect(platform.name)}
                >
                  Connect
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posting Schedule</CardTitle>
          <CardDescription>
            Configure your default posting times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Schedule settings coming soon! This will allow you to set optimal posting times for each platform.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage how you receive updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification preferences coming soon! Get alerts when reels are posted or receive engagement updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
