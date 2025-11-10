import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Mail, TrendingUp, Users, Shield } from "lucide-react";

interface NotificationPrefs {
  // Authentication
  welcome_email: boolean;
  email_verification: boolean;
  password_reset: boolean;
  login_new_device: boolean;
  // Post status
  post_published: boolean;
  post_failed: boolean;
  scheduled_reminder: boolean;
  analytics_milestone: boolean;
  // Account
  subscription_renewal: boolean;
  payment_failed: boolean;
  subscription_expired: boolean;
  usage_limit_warning: boolean;
  platform_disconnected: boolean;
  // Engagement
  weekly_summary: boolean;
  monthly_report: boolean;
  top_post_notification: boolean;
  // Team
  team_invitation: boolean;
  post_approval: boolean;
  draft_comment: boolean;
}

export function NotificationPreferences() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPrefs(data);
      } else {
        // Create default preferences
        const { data: newPrefs, error: insertError } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setPrefs(newPrefs);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) return;

    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notification_preferences")
        .update({ [key]: value })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Notification preferences updated");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
      // Revert on error
      setPrefs({ ...prefs, [key]: !value });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prefs) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-6 w-11 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <CardTitle>{t('settings.notifications')}</CardTitle>
        </div>
        <CardDescription>
          {t('settings.notificationsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authentication Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Authentication</h4>
          </div>
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="welcome_email" className="cursor-pointer">
                Welcome email
              </Label>
              <Switch
                id="welcome_email"
                checked={prefs.welcome_email}
                onCheckedChange={(checked) => updatePreference("welcome_email", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="login_new_device" className="cursor-pointer">
                Login from new device
              </Label>
              <Switch
                id="login_new_device"
                checked={prefs.login_new_device}
                onCheckedChange={(checked) => updatePreference("login_new_device", checked)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Post Status Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Post Status</h4>
          </div>
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="post_published" className="cursor-pointer">
                Post published successfully
              </Label>
              <Switch
                id="post_published"
                checked={prefs.post_published}
                onCheckedChange={(checked) => updatePreference("post_published", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="post_failed" className="cursor-pointer">
                Post failed to publish
              </Label>
              <Switch
                id="post_failed"
                checked={prefs.post_failed}
                onCheckedChange={(checked) => updatePreference("post_failed", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="scheduled_reminder" className="cursor-pointer">
                Scheduled post reminder (24h before)
              </Label>
              <Switch
                id="scheduled_reminder"
                checked={prefs.scheduled_reminder}
                onCheckedChange={(checked) => updatePreference("scheduled_reminder", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics_milestone" className="cursor-pointer">
                Analytics milestones (1K, 10K views)
              </Label>
              <Switch
                id="analytics_milestone"
                checked={prefs.analytics_milestone}
                onCheckedChange={(checked) => updatePreference("analytics_milestone", checked)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Account Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Account Updates</h4>
          </div>
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="subscription_renewal" className="cursor-pointer">
                Subscription renewal reminder
              </Label>
              <Switch
                id="subscription_renewal"
                checked={prefs.subscription_renewal}
                onCheckedChange={(checked) => updatePreference("subscription_renewal", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="payment_failed" className="cursor-pointer">
                Payment failed
              </Label>
              <Switch
                id="payment_failed"
                checked={prefs.payment_failed}
                onCheckedChange={(checked) => updatePreference("payment_failed", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="usage_limit_warning" className="cursor-pointer">
                Usage limit approaching
              </Label>
              <Switch
                id="usage_limit_warning"
                checked={prefs.usage_limit_warning}
                onCheckedChange={(checked) => updatePreference("usage_limit_warning", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="platform_disconnected" className="cursor-pointer">
                Platform disconnected
              </Label>
              <Switch
                id="platform_disconnected"
                checked={prefs.platform_disconnected}
                onCheckedChange={(checked) => updatePreference("platform_disconnected", checked)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Engagement Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Performance & Analytics</h4>
          </div>
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="weekly_summary" className="cursor-pointer">
                Weekly analytics summary
              </Label>
              <Switch
                id="weekly_summary"
                checked={prefs.weekly_summary}
                onCheckedChange={(checked) => updatePreference("weekly_summary", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="monthly_report" className="cursor-pointer">
                Monthly performance report
              </Label>
              <Switch
                id="monthly_report"
                checked={prefs.monthly_report}
                onCheckedChange={(checked) => updatePreference("monthly_report", checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="top_post_notification" className="cursor-pointer">
                Top performing post alerts
              </Label>
              <Switch
                id="top_post_notification"
                checked={prefs.top_post_notification}
                onCheckedChange={(checked) => updatePreference("top_post_notification", checked)}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}