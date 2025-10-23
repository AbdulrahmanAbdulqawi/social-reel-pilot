import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, Calendar } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface GetLateAccount {
  _id: string;
  platform: string;
  username: string;
  displayName: string;
  isActive: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const Upload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [accounts, setAccounts] = useState<GetLateAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    loadGetLateAccounts();
  }, []);

  const loadGetLateAccounts = async () => {
    try {
      // Get profile first
      const { data: profilesData, error: profilesError } = await supabase.functions.invoke('getlate-connect', {
        body: { action: 'list-profiles' }
      });

      if (profilesError) throw profilesError;

      const profiles = profilesData?.profiles || [];
      if (profiles.length === 0) {
        toast.error('No GetLate profile found. Please go to Settings to connect platforms.');
        setLoadingAccounts(false);
        return;
      }

      const profile = profiles[0];
      setProfileId(profile._id);

      // Get connected accounts
      const { data: accountsData, error: accountsError } = await supabase.functions.invoke('getlate-connect', {
        body: {
          action: 'list-accounts',
          profileId: profile._id
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file");
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be less than 100MB");
        return;
      }
      
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId) {
      toast.error("Please select a social media account");
      return;
    }

    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload video file
      const fileExt = videoFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("reels")
        .getPublicUrl(filePath);

      // Get selected account details
      const selectedAccount = accounts.find(acc => acc._id === selectedAccountId);
      if (!selectedAccount) {
        throw new Error("Selected account not found");
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
          platform: selectedAccount.platform as "instagram" | "tiktok" | "youtube",
          video_url: publicUrl,
          scheduled_at: scheduledFor,
          status: (scheduledFor ? "scheduled" : "draft") as "draft" | "scheduled" | "posted" | "failed",
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Post to GetLate
      toast.info("Posting to GetLate...");
      
      const { data: postResult, error: postError } = await supabase.functions.invoke('getlate-post', {
        body: {
          reelId: reelData.id,
          videoUrl: publicUrl,
          title,
          caption,
          hashtags: hashtagsArray,
          platform: selectedAccount.platform,
          accountId: selectedAccountId,
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

      // Update reel status to posted
      await supabase
        .from("reels")
        .update({ 
          status: scheduledFor ? "scheduled" : "posted",
          posted_at: scheduledFor ? null : new Date().toISOString()
        })
        .eq("id", reelData.id);

      toast.success(`Reel ${scheduledFor ? 'scheduled' : 'posted'} successfully!`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating reel:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create reel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload New Reel</CardTitle>
          <CardDescription>
            Create and schedule your social media content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="video">Video File</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="video" className="cursor-pointer">
                  <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {videoFile ? (
                    <p className="text-sm font-medium">{videoFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                  )}
                </label>
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="account">Social Media Account *</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={loadingAccounts} required>
                <SelectTrigger>
                  <SelectValue placeholder={loadingAccounts ? "Loading accounts..." : "Select account"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} - @{account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loadingAccounts && accounts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No accounts connected. <a href="/settings" className="text-primary underline">Go to Settings</a> to connect your platforms.
                </p>
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
              <Button type="submit" disabled={loading || !videoFile || !selectedAccountId || loadingAccounts} className="flex-1">
                {loading ? "Creating..." : "Create Reel"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;
