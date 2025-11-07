import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Video, Calendar, BarChart3, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-3xl">
              <Video className="w-16 h-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Welcome to ReelHub
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your ultimate platform to upload, schedule, and manage short videos for Instagram, TikTok, and YouTube Shorts. Streamline your content creation workflow.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gap-2"
            >
              Get Started
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 border rounded-xl bg-card hover:shadow-card transition-shadow">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Upload</h3>
            <p className="text-muted-foreground">
              Drag and drop your videos with captions, hashtags, and platform selection all in one place.
            </p>
          </div>

          <div className="p-6 border rounded-xl bg-card hover:shadow-card transition-shadow">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-muted-foreground">
              Schedule your reels to post automatically at optimal times across all platforms.
            </p>
          </div>

          <div className="p-6 border rounded-xl bg-card hover:shadow-card transition-shadow">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground">
              Track views, likes, and engagement across Instagram, TikTok, and YouTube Shorts.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center p-8 border rounded-2xl bg-card max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to grow your audience?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of creators managing their social media content with ReelHub.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Start Free Today
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 ReelHub. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Button
                variant="link"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/contact")}
              >
                Contact Us
              </Button>
              <Button
                variant="link"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/terms")}
              >
                Terms of Service
              </Button>
              <Button
                variant="link"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/privacy")}
              >
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
