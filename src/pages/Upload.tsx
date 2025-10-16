import { useState } from "react";
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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const uploadSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  caption: z.string()
    .max(2000, "Caption must be less than 2000 characters")
    .optional(),
  hashtags: z.string()
    .max(500, "Hashtags too long")
    .optional(),
  platform: z.enum(["instagram", "tiktok", "youtube"], {
    errorMap: () => ({ message: "Please select a platform" }),
  }),
});

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
    
    const validation = uploadSchema.safeParse({
      title,
      caption,
      hashtags,
      platform,
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let videoUrl = null;

      // Upload video file if provided
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("reels")
          .upload(filePath, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("reels")
          .getPublicUrl(filePath);

        videoUrl = publicUrl;
      }

      // Combine date and time for scheduled_at
      let scheduledAt = null;
      if (scheduledDate && scheduledTime) {
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      // Convert hashtags string to array
      const hashtagsArray = hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error: insertError } = await supabase
        .from("reels")
        .insert([{
          user_id: user.id,
          title,
          caption: caption || null,
          hashtags: hashtagsArray.length > 0 ? hashtagsArray : null,
          platform: platform as "instagram" | "tiktok" | "youtube",
          video_url: videoUrl,
          scheduled_at: scheduledAt,
          status: (scheduledAt ? "scheduled" : "draft") as "draft" | "scheduled" | "posted" | "failed",
        }]);

      if (insertError) throw insertError;

      toast.success("Reel created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to create reel");
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
              <Label htmlFor="platform">Platform *</Label>
              <Select value={platform} onValueChange={setPlatform} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube Shorts</SelectItem>
                </SelectContent>
              </Select>
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
              <Button type="submit" disabled={loading} className="flex-1">
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
