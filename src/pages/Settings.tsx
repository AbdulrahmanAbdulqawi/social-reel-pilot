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
      const redirectUri = `${window.location.origin}/settings`;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in first');
        return;
      }

      // Check for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        // Handle OAuth callback
        const { data, error } = await supabase.functions.invoke('oauth-callback', {
          body: {
            platform: platform.toLowerCase(),
            code,
            userId: user.id,
            redirectUri
          }
        });

        if (error) {
          toast.error(`Failed to connect ${platform}`);
          console.error('OAuth callback error:', error);
        } else {
          toast.success(`${platform} connected successfully!`);
          fetchConnectedAccounts();
          // Clear URL params
          window.history.replaceState({}, '', window.location.pathname);
        }
        return;
      }

      // Initiate OAuth flow
      let authUrl = '';
      
      switch (platform.toLowerCase()) {
        case 'tiktok': {
          const { data, error } = await supabase.functions.invoke('tiktok-auth-url', {
            body: { redirectUri }
          });
          if (error || !data?.url) {
            console.error('TikTok auth URL error:', error);
            toast.error('Failed to start TikTok connect');
            return;
          }
          authUrl = data.url as string;
          break;
        }
          
        case 'instagram':
          toast.info('Instagram OAuth - Coming soon');
          return;
          
        case 'youtube':
          toast.info('YouTube OAuth - Coming soon');
          return;
          
        default:
          toast.error('Unknown platform');
          return;
      }
      
      // Redirect to OAuth
      window.location.href = authUrl;
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
