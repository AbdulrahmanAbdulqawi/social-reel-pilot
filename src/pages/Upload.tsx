import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, X, Image as ImageIcon, Video, FileText, Instagram, Youtube, Facebook } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// TikTok Icon Component
const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface GetLateAccount {
  _id: string;
  platform: string;
  username: string;
  displayName: string;
  isActive: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

type MediaFile = {
  file: File;
  type: 'video' | 'image';
  preview: string;
};

const Upload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [accounts, setAccounts] = useState<GetLateAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    loadGetLateAccounts();
  }, []);

  const loadGetLateAccounts = async () => {
    try {
      // Get user's profile to find their GetLate profile ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('getlate_profile_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const getlateProfileId = profileData?.getlate_profile_id;
      if (!getlateProfileId) {
        toast.error('No GetLate profile linked. Please go to Settings to connect platforms.');
        setLoadingAccounts(false);
        return;
      }

      setProfileId(getlateProfileId);

      // Get connected accounts using the user's profile ID
      const { data: accountsData, error: accountsError } = await supabase.functions.invoke('getlate-connect', {
        body: {
          action: 'list-accounts',
          profileId: getlateProfileId
        }
      });

      if (accountsError) throw accountsError;

      const connectedAccounts = accountsData?.accounts || [];
      setAccounts(connectedAccounts.filter((acc: GetLateAccount) => acc.isActive));

      if (connectedAccounts.length === 0) {
        toast.info('No platforms connected. Please go to Settings to connect your accounts.');
      }
    } catch (error) {
      console.error('Error loading GetLate accounts:', error);
      toast.error('Failed to load connected accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newMediaFiles: MediaFile[] = [];
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 100MB limit`);
        continue;
      }
      
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      
      if (!isVideo && !isImage) {
        toast.error(`${file.name} is not a valid image or video`);
        continue;
      }
      
      newMediaFiles.push({
        file,
        type: isVideo ? 'video' : 'image',
        preview: URL.createObjectURL(file)
      });
    }
    
    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const togglePlatform = (accountId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (mediaFiles.length === 0 && !caption.trim()) {
      toast.error("Please add media files or write a caption");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload all media files
      const mediaItems: Array<{ type: string; url: string }> = [];
      
      for (const media of mediaFiles) {
        const fileExt = media.file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("reels")
          .upload(filePath, media.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("reels")
          .getPublicUrl(filePath);

        mediaItems.push({
          type: media.type,
          url: publicUrl
        });
      }

      // Get selected accounts
      const selectedAccounts = accounts.filter(acc => selectedPlatforms.includes(acc._id));
      if (selectedAccounts.length === 0) {
        throw new Error("No valid accounts selected");
      }

      // Determine media type
      const hasVideo = mediaItems.some(m => m.type === 'video');
      const hasImage = mediaItems.some(m => m.type === 'image');
      let mediaType: string;
      if (mediaItems.length === 0) {
        mediaType = 'text';
      } else if (hasVideo && hasImage) {
        mediaType = 'mixed';
      } else if (hasVideo) {
        mediaType = 'video';
      } else {
        mediaType = 'image';
      }

      // Combine date and time for scheduling
      let scheduledFor = null;
      let timezone = 'UTC';
      if (scheduledDate && scheduledTime) {
        scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      // Convert hashtags string to array
      const hashtagsArray = hashtags
        .split(',')
        .map(tag => tag.trim().replace(/^#/, ''))
        .filter(tag => tag.length > 0);

      // Create reel record in database
      const { data: reelData, error: insertError } = await supabase
        .from("reels")
        .insert([{
          user_id: user.id,
          title,
          caption: caption || null,
          hashtags: hashtagsArray.length > 0 ? hashtagsArray : null,
          platforms: selectedAccounts.map(acc => acc.platform),
          platform: selectedAccounts[0].platform as "instagram" | "tiktok" | "youtube",
          media_type: mediaType,
          media_items: mediaItems,
          video_url: mediaItems[0]?.url || null,
          scheduled_at: scheduledFor,
          status: (scheduledFor ? "scheduled" : "draft") as "draft" | "scheduled" | "posted" | "failed",
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Post to GetLate with multiple platforms
      toast.info(`Posting to ${selectedAccounts.length} platform(s)...`);
      
      const { data: postResult, error: postError } = await supabase.functions.invoke('getlate-post', {
        body: {
          reelId: reelData.id,
          mediaItems,
          title,
          caption,
          hashtags: hashtagsArray,
          platforms: selectedAccounts.map(acc => ({
            platform: acc.platform,
            accountId: acc._id
          })),
          scheduledFor,
          timezone,
        }
      });

      if (postError) {
        // Update reel status to failed
        await supabase
          .from("reels")
          .update({ status: "failed" })
          .eq("id", reelData.id);
        
        throw postError;
      }

      console.log('GetLate post result:', postResult);

      toast.success(`Content ${scheduledFor ? 'scheduled' : 'posted'} to ${selectedAccounts.length} platform(s)!`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating reel:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create reel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Post</CardTitle>
          <CardDescription>
            Share your content across multiple platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Media Upload Section */}
            <div className="space-y-4">
              <Label>Media Files (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  id="media"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="media" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <UploadIcon className="w-10 h-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload images or videos</p>
                      <p className="text-xs text-muted-foreground">
                        Multiple files supported • Max 100MB each
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Preview uploaded files */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaFiles.map((media, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border">
                      {media.type === 'video' ? (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                      ) : (
                        <img 
                          src={media.preview} 
                          alt={`Preview ${index + 1}`}
                          className="aspect-video object-cover w-full"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <Badge variant="secondary" className="absolute bottom-2 left-2">
                        {media.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter reel title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Write your caption here..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                placeholder="trending, viral, creator (comma-separated)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>

            {/* Platform Selection */}
            <div className="space-y-3">
              <Label>Platforms to Post *</Label>
              {loadingAccounts ? (
                <p className="text-sm text-muted-foreground">Loading platforms...</p>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No accounts connected. <a href="/settings" className="text-primary underline">Go to Settings</a> to connect your platforms.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accounts.map((account) => {
                    const getPlatformIcon = (platform: string) => {
                      const iconClass = "w-5 h-5";
                      switch (platform.toLowerCase()) {
                        case 'instagram':
                          return <Instagram className={`${iconClass} text-pink-500`} />;
                        case 'facebook':
                          return <Facebook className={`${iconClass} text-blue-600`} />;
                        case 'tiktok':
                          return <TikTokIcon className={iconClass} />;
                        case 'youtube':
                          return <Youtube className={`${iconClass} text-red-500`} />;
                        default:
                          return null;
                      }
                    };

                    return (
                      <label
                        key={account._id}
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPlatforms.includes(account._id)
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedPlatforms.includes(account._id)}
                          onCheckedChange={() => togglePlatform(account._id)}
                        />
                        {getPlatformIcon(account.platform)}
                        <div className="flex-1 pointer-events-none">
                          <p className="font-medium text-sm">
                            {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">@{account.username}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Schedule Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Schedule Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || selectedPlatforms.length === 0 || loadingAccounts}
                className="flex-1"
              >
                {loading ? "Posting..." : `Post to ${selectedPlatforms.length || 0} Platform(s)`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;
