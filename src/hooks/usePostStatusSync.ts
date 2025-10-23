import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePostStatusSync = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const syncPostStatus = async () => {
      try {
        // Fetch all scheduled posts that should have been published by now
        const { data: scheduledPosts, error: fetchError } = await supabase
          .from("reels")
          .select("*")
          .eq("status", "scheduled")
          .lte("scheduled_at", new Date().toISOString());

        if (fetchError) throw fetchError;
        if (!scheduledPosts || scheduledPosts.length === 0) return;

        console.log(`Syncing status for ${scheduledPosts.length} scheduled posts`);

        // Check status and fetch analytics for each post
        for (const post of scheduledPosts) {
          if (!post.getlate_post_id) continue;

          try {
            const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke(
              "getlate-analytics",
              {
                body: { postId: post.getlate_post_id },
              }
            );

            if (analyticsError) {
              console.error(`Failed to fetch analytics for post ${post.id}:`, analyticsError);
              continue;
            }

            // Check if post has been published
            const postData = analyticsData?.postData;
            if (postData?.status === "published" || postData?.status === "live") {
              await supabase
                .from("reels")
                .update({
                  status: "posted",
                  posted_at: postData.publishedAt || new Date().toISOString(),
                })
                .eq("id", post.id);

              console.log(`Post ${post.id} marked as published`);
            } else if (postData?.status === "failed") {
              await supabase
                .from("reels")
                .update({ status: "failed" })
                .eq("id", post.id);

              console.log(`Post ${post.id} marked as failed`);
            }
          } catch (error) {
            console.error(`Error syncing post ${post.id}:`, error);
          }
        }
      } catch (error) {
        console.error("Error syncing post status:", error);
      }
    };

    // Initial sync
    syncPostStatus();

    // Poll every 2 minutes
    const interval = setInterval(syncPostStatus, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled]);
};
