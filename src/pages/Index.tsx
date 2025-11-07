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
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-primary rounded-3xl">
              <Video className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-primary bg-clip-text text-transparent px-4">
            Welcome to ReelHub
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
            Your ultimate platform to upload, schedule, and manage short videos for Instagram, TikTok, and YouTube Shorts. Streamline your content creation workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gap-2 w-full sm:w-auto"
            >
              Get Started
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="p-5 sm:p-6 border rounded-xl bg-card hover:shadow-card transition-shadow">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg w-fit mb-3 sm:mb-4">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Easy Upload</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Drag and drop your videos with captions, hashtags, and platform selection all in one place.
            </p>
          </div>

          <div className="p-5 sm:p-6 border rounded-xl bg-card hover:shadow-card transition-shadow">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg w-fit mb-3 sm:mb-4">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Schedule your reels to post automatically at optimal times across all platforms.
            </p>
          </div>

          <div className="p-5 sm:p-6 border rounded-xl bg-card hover:shadow-card transition-shadow sm:col-span-2 md:col-span-1">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg w-fit mb-3 sm:mb-4">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track views, likes, and engagement across Instagram, TikTok, and YouTube Shorts.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 text-center p-6 sm:p-8 border rounded-2xl bg-card max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-4">Ready to grow your audience?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
            Join thousands of creators managing their social media content with ReelHub.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="w-full sm:w-auto">
            Start Free Today
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
              © 2025 ReelHub. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Button
                variant="link"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                onClick={() => navigate("/contact")}
              >
                Contact Us
              </Button>
              <Button
                variant="link"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                onClick={() => navigate("/terms")}
              >
                Terms of Service
              </Button>
              <Button
                variant="link"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
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
