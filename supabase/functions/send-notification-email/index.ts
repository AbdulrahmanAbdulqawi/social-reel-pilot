import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  userId: string;
  emailType: string;
  data: Record<string, any>;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, emailType, data }: EmailRequest = await req.json();

    console.log(`Processing email request: ${emailType} for user: ${userId}`);

    // Get user profile and notification preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, username")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile?.email) {
      throw new Error("User profile or email not found");
    }

    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Check if this notification type is enabled
    const preferencesMap: Record<string, string> = {
      "welcome": "welcome_email",
      "post_published": "post_published",
      "post_failed": "post_failed",
      "weekly_summary": "weekly_summary",
      "monthly_report": "monthly_report",
      "scheduled_reminder": "scheduled_reminder",
      "analytics_milestone": "analytics_milestone",
      "subscription_renewal": "subscription_renewal",
      "payment_failed": "payment_failed",
      "usage_limit_warning": "usage_limit_warning",
      "platform_disconnected": "platform_disconnected",
    };

    const prefKey = preferencesMap[emailType];
    if (prefKey && preferences && !preferences[prefKey]) {
      console.log(`Email type ${emailType} is disabled for user ${userId}`);
      return new Response(
        JSON.stringify({ message: "Email notification disabled by user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate email HTML and subject based on type
    let html: string;
    let subject: string;
    const appUrl = "https://social-reel-pilot.lovable.app";
    const username = profile.username || "there";

    switch (emailType) {
      case "welcome":
        subject = "Welcome to ReelHub!";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #e0e0e0;">
            <div style="padding: 32px 20px; text-align: center; border-bottom: 1px solid #333;">
              <h1 style="color: #8B8000; font-size: 32px; margin: 0;">ReelHub</h1>
            </div>
            <div style="padding: 32px 20px;">
              <h2 style="color: #ffffff; font-size: 24px;">Welcome to ReelHub, ${username}!</h2>
              <p style="font-size: 14px; line-height: 24px; margin-bottom: 16px;">
                Thank you for joining ReelHub! We're excited to help you manage and schedule your social media content across multiple platforms.
              </p>
              <p style="font-size: 14px; line-height: 24px; margin-bottom: 16px;">Here's what you can do:</p>
              <ul style="font-size: 14px; line-height: 24px; margin-bottom: 16px;">
                <li>📱 Post to Instagram, TikTok, YouTube, and Facebook</li>
                <li>📅 Schedule posts in advance</li>
                <li>📊 Track analytics and engagement</li>
                <li>✨ Manage all your content in one place</li>
              </ul>
              <p style="text-align: center; margin: 24px 0;">
                <a href="${appUrl}/dashboard" style="background-color: #8B8000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Go to Dashboard</a>
              </p>
            </div>
            <div style="padding: 32px 20px; border-top: 1px solid #333; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">ReelHub - Social Media Management Made Simple</p>
            </div>
          </div>
        `;
        break;

      case "post_published":
        subject = `Your post "${data.postTitle}" was published!`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #e0e0e0;">
            <div style="padding: 32px 20px; text-align: center; border-bottom: 1px solid #333;">
              <h1 style="color: #8B8000; font-size: 32px; margin: 0;">ReelHub</h1>
            </div>
            <div style="padding: 32px 20px;">
              <h2 style="color: #ffffff; font-size: 24px;">🎉 Post Published Successfully!</h2>
              <p style="font-size: 14px; line-height: 24px; margin-bottom: 16px;">
                Great news! Your post has been successfully published to ${data.platform}.
              </p>
              <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #8B8000; font-size: 18px; font-weight: bold; margin-bottom: 8px;">📝 ${data.postTitle}</p>
                <p style="color: #999; font-size: 14px; margin: 0;">Platform: ${data.platform}</p>
              </div>
              <p style="text-align: center; margin: 24px 0;">
                <a href="${appUrl}/analytics" style="background-color: #8B8000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Analytics</a>
              </p>
            </div>
            <div style="padding: 32px 20px; border-top: 1px solid #333; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">ReelHub - Social Media Management Made Simple</p>
            </div>
          </div>
        `;
        break;

      case "post_failed":
        subject = `Failed to publish "${data.postTitle}"`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #e0e0e0;">
            <div style="padding: 32px 20px; text-align: center; border-bottom: 1px solid #333;">
              <h1 style="color: #8B8000; font-size: 32px; margin: 0;">ReelHub</h1>
            </div>
            <div style="padding: 32px 20px;">
              <h2 style="color: #ffffff; font-size: 24px;">⚠️ Post Publishing Failed</h2>
              <p style="font-size: 14px; line-height: 24px; margin-bottom: 16px;">
                We encountered an issue while trying to publish your post to ${data.platform}.
              </p>
              <div style="background-color: #2a1a1a; border: 1px solid #d84315; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #fff; font-size: 18px; font-weight: bold; margin-bottom: 12px;">📝 ${data.postTitle}</p>
                <p style="color: #d84315; font-size: 14px; font-weight: bold; margin-bottom: 8px;">Error Details:</p>
                <p style="color: #ff8a65; font-size: 13px; font-family: monospace; background-color: #1a0a0a; padding: 12px; border-radius: 4px; margin: 0;">${data.errorMessage}</p>
              </div>
              <p style="font-size: 14px; line-height: 24px; margin-bottom: 16px;">
                Don't worry! Your content is saved as a draft. You can review and retry publishing it from your dashboard.
              </p>
              <p style="text-align: center; margin: 24px 0;">
                <a href="${appUrl}/dashboard" style="background-color: #8B8000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Dashboard</a>
              </p>
            </div>
            <div style="padding: 32px 20px; border-top: 1px solid #333; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">ReelHub - Social Media Management Made Simple</p>
            </div>
          </div>
        `;
        break;

      case "weekly_summary":
        subject = "Your Weekly Social Media Summary";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #e0e0e0;">
            <div style="padding: 32px 20px; text-align: center; border-bottom: 1px solid #333;">
              <h1 style="color: #8B8000; font-size: 32px; margin: 0;">ReelHub</h1>
            </div>
            <div style="padding: 32px 20px;">
              <h2 style="color: #ffffff; font-size: 24px;">📊 Your Weekly Summary</h2>
              <p style="font-size: 14px; line-height: 24px; margin-bottom: 16px;">
                Here's how your content performed this week:
              </p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
                <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center;">
                  <p style="color: #8B8000; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">${data.totalPosts}</p>
                  <p style="color: #999; font-size: 12px; margin: 0;">POSTS PUBLISHED</p>
                </div>
                <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center;">
                  <p style="color: #8B8000; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">${data.totalViews.toLocaleString()}</p>
                  <p style="color: #999; font-size: 12px; margin: 0;">TOTAL VIEWS</p>
                </div>
                <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center;">
                  <p style="color: #8B8000; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">${data.totalLikes.toLocaleString()}</p>
                  <p style="color: #999; font-size: 12px; margin: 0;">TOTAL LIKES</p>
                </div>
                <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center;">
                  <p style="color: #8B8000; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">${data.totalComments.toLocaleString()}</p>
                  <p style="color: #999; font-size: 12px; margin: 0;">COMMENTS</p>
                </div>
              </div>
              ${data.topPost ? `
                <h3 style="color: #fff; font-size: 18px; font-weight: bold; margin-top: 32px; margin-bottom: 16px;">🏆 Top Performing Post</h3>
                <div style="background-color: #1a1a1a; border: 2px solid #8B8000; border-radius: 8px; padding: 20px; margin: 16px 0 24px 0;">
                  <p style="color: #fff; font-size: 16px; font-weight: bold; margin-bottom: 8px;">${data.topPost.title}</p>
                  <p style="color: #8B8000; font-size: 14px; margin: 0;">${data.topPost.views.toLocaleString()} views on ${data.topPost.platform}</p>
                </div>
              ` : ''}
              <p style="text-align: center; margin: 24px 0;">
                <a href="${appUrl}/analytics" style="background-color: #8B8000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Full Analytics</a>
              </p>
            </div>
            <div style="padding: 32px 20px; border-top: 1px solid #333; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">ReelHub - Social Media Management Made Simple</p>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "ReelHub <onboarding@resend.dev>",
      to: [profile.email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log email activity
    await supabase.from("email_logs").insert({
      user_id: userId,
      email_to: profile.email,
      email_type: emailType,
      subject,
      status: "sent",
      resend_id: emailResponse.data?.id,
      metadata: data,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});