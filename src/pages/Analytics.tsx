import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Eye } from "lucide-react";

const Analytics = () => {
  const stats = [
    {
      title: "Total Views",
      value: "12.5K",
      change: "+12.5%",
      icon: Eye,
    },
    {
      title: "Engagement Rate",
      value: "8.2%",
      change: "+2.1%",
      icon: TrendingUp,
    },
    {
      title: "New Followers",
      value: "234",
      change: "+18.2%",
      icon: Users,
    },
    {
      title: "Avg. Watch Time",
      value: "45s",
      change: "+5.3%",
      icon: BarChart3,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your performance across platforms</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Views by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Instagram</span>
                <span className="text-sm text-muted-foreground">5.2K views</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-pink-500" style={{ width: "42%" }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">TikTok</span>
                <span className="text-sm text-muted-foreground">4.8K views</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-black" style={{ width: "38%" }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">YouTube</span>
                <span className="text-sm text-muted-foreground">2.5K views</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: "20%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Reels</CardTitle>
            <CardDescription>Based on engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Summer Vibes #1", views: "2.1K", engagement: "9.2%" },
                { title: "Tutorial: Quick Edit", views: "1.8K", engagement: "8.5%" },
                { title: "Behind the Scenes", views: "1.5K", engagement: "7.8%" },
              ].map((reel, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{reel.title}</p>
                    <p className="text-sm text-muted-foreground">{reel.views} views</p>
                  </div>
                  <span className="text-sm font-medium text-primary">{reel.engagement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
