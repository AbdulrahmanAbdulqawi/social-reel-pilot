import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  platformBreakdown: {
    platform: string;
    views: number;
    percentage: number;
  }[];
  topPosts: {
    title: string;
    views: number;
    engagementRate: number;
  }[];
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch all posted reels with their analytics
      const { data: reels, error: reelsError } = await supabase
        .from("reels")
        .select(`
          *,
          reel_analytics (*)
        `)
        .eq("status", "posted");

      if (reelsError) throw reelsError;

      if (!reels || reels.length === 0) {
        setAnalytics({
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          avgEngagementRate: 0,
          platformBreakdown: [],
          topPosts: [],
        });
        return;
      }

      // Calculate total analytics
      let totalViews = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      const platformStats: Record<string, number> = {};

      reels.forEach((reel: any) => {
        const analytics = reel.reel_analytics || [];
        analytics.forEach((analytic: any) => {
          totalViews += analytic.views || 0;
          totalLikes += analytic.likes || 0;
          totalComments += analytic.comments || 0;
          totalShares += analytic.shares || 0;
        });

        // Track platform stats
        if (reel.platforms && Array.isArray(reel.platforms)) {
          reel.platforms.forEach((platform: string) => {
            platformStats[platform] = (platformStats[platform] || 0) + (analytics[0]?.views || 0);
          });
        }
      });

      // Calculate engagement rate
      const totalEngagements = totalLikes + totalComments + totalShares;
      const avgEngagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;

      // Prepare platform breakdown
      const totalPlatformViews = Object.values(platformStats).reduce((a, b) => a + b, 0);
      const platformBreakdown = Object.entries(platformStats).map(([platform, views]) => ({
        platform,
        views,
        percentage: totalPlatformViews > 0 ? (views / totalPlatformViews) * 100 : 0,
      }));

      // Get top posts
      const postsWithAnalytics = reels
        .map((reel: any) => {
          const analytics = reel.reel_analytics?.[0] || {};
          const views = analytics.views || 0;
          const engagements = (analytics.likes || 0) + (analytics.comments || 0) + (analytics.shares || 0);
          return {
            title: reel.title || "Untitled",
            views,
            engagementRate: views > 0 ? (engagements / views) * 100 : 0,
          };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 3);

      setAnalytics({
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagementRate,
        platformBreakdown,
        topPosts: postsWithAnalytics,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
      tiktok: "bg-black",
      youtube: "bg-red-500",
      facebook: "bg-blue-600",
    };
    return colors[platform.toLowerCase()] || "bg-primary";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const stats = [
    {
      title: "Total Views",
      value: formatNumber(analytics.totalViews),
      icon: Eye,
      detail: `${analytics.totalViews.toLocaleString()} total views`,
    },
    {
      title: "Engagement Rate",
      value: `${analytics.avgEngagementRate.toFixed(1)}%`,
      icon: TrendingUp,
      detail: "Average across all posts",
    },
    {
      title: "Total Likes",
      value: formatNumber(analytics.totalLikes),
      icon: Users,
      detail: `${analytics.totalLikes.toLocaleString()} total likes`,
    },
    {
      title: "Total Interactions",
      value: formatNumber(analytics.totalLikes + analytics.totalComments + analytics.totalShares),
      icon: BarChart3,
      detail: "Likes + Comments + Shares",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Track your performance across platforms</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {stats.map((stat, index) => (
          <Card key={stat.title} className="animate-fade-in" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Views by platform</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.platformBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No platform data available yet
              </p>
            ) : (
              <div className="space-y-4">
                {analytics.platformBreakdown.map((platform) => (
                  <div key={platform.platform}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{platform.platform}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(platform.views)} views
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPlatformColor(platform.platform)}`}
                        style={{ width: `${platform.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>Based on views and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No posts published yet
              </p>
            ) : (
              <div className="space-y-4">
                {analytics.topPosts.map((post, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(post.views)} views</p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {post.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
