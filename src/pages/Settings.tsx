import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, Youtube, Facebook, Camera, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { ensureUserHasGetLateProfile } from "@/lib/getlateProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlatformCard } from "@/components/PlatformCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

interface GetLateAccount {
  _id: string;
  platform: string;
  username: string;
  displayName: string;
  isActive: boolean;
  profileId: string;
  profilePicture?: string;
}

interface GetLateProfile {
  _id: string;
  name: string;
  description?: string;
}

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

const profileFormSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
});

const Settings = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<GetLateAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [initializingProfile, setInitializingProfile] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  useEffect(() => {
    // Check OAuth callback first
    handleOAuthCallback();
    
    // Load user profile
    loadUserProfile();
    
    // Initialize profile from database
    initializeGetLateProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      form.reset({
        username: data.username || "",
        email: data.email || "",
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const initializeGetLateProfile = async () => {
    setInitializingProfile(true);
    try {
      const profileId = await ensureUserHasGetLateProfile();
      
      if (!profileId) {
        throw new Error('Failed to initialize GetLate profile');
      }

      setProfileId(profileId);
      await fetchConnectedAccounts(profileId);
    } catch (error) {
      console.error('Error initializing GetLate profile:', error);
      toast.error('Failed to initialize GetLate. Please try refreshing the page.');
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
    return account;
  };

  const handleDisconnect = async (platform: string) => {
    const account = getAccountInfo(platform);
    if (!account || !profileId) return;

    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    try {
      const { error } = await supabase.functions.invoke('getlate-connect', {
        body: {
          action: 'disconnect-account',
          accountId: account._id,
          profileId
        }
      });

      if (error) throw error;
      
      toast.success(`${platform} disconnected successfully`);
      await fetchConnectedAccounts(profileId);
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error(`Failed to disconnect ${platform}`);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WEBP, or GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setAvatarUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          email: values.email,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, username: values.username, email: values.email } : null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  // Show page immediately, display loading state only when fetching accounts
  const isInitializing = initializingProfile && !profileId;

  const platforms = [
    {
      name: "Instagram",
      icon: Instagram,
      color: "text-pink-500",
      connected: isConnected('instagram'),
      account: getAccountInfo('instagram'),
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
      account: getAccountInfo('tiktok'),
    },
    {
      name: "YouTube",
      icon: Youtube,
      color: "text-red-500",
      connected: isConnected('youtube'),
      account: getAccountInfo('youtube'),
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-600",
      connected: isConnected('facebook'),
      account: getAccountInfo('facebook'),
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage your profile and connected platforms
        </p>
      </div>

      <Card className="animate-fade-in mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your account details and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    <User className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={avatarUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              {avatarUploading && (
                <div className="text-sm text-muted-foreground">Uploading...</div>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onProfileSubmit)} className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
          <CardDescription>
            Connect your social media accounts to start posting (powered by GetLate)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInitializing ? (
            <LoadingSkeleton variant="list" count={4} />
          ) : (
            platforms.map((platform) => (
              <PlatformCard
                key={platform.name}
                name={platform.name}
                icon={platform.icon}
                color={platform.color}
                connected={platform.connected}
                account={platform.account}
                loading={loading}
                profileId={profileId}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
