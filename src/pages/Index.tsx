import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Video, Calendar, BarChart3, Zap, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex-center">
          <div className="flex-gap-sm">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-light rounded-xl">
              <Video className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl gradient-text">
              ReelHub
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20 animate-fade-in">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="p-4 sm:p-5 bg-gradient-to-br from-primary to-primary-light rounded-3xl shadow-glow animate-pulse">
              <Video className="w-14 h-14 sm:w-20 sm:h-20 text-primary-foreground" />
            </div>
          </div>
          <h1 className="heading-page sm:text-5xl md:text-6xl lg:text-7xl mb-6 sm:mb-8 gradient-text px-4 leading-tight">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 px-4 max-w-3xl mx-auto">
            {t('dashboard.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gap-2 w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-primary to-primary-light hover:shadow-glow transition-all group"
            >
              {t('onboarding.getStarted')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg border-2 hover:border-primary/50 hover:bg-accent transition-all"
            >
              {t('auth.signIn')}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-16 sm:mb-20">
          <div className="card-interactive p-6 sm:p-8 border-2 hover:shadow-glow hover-lift group">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl w-fit mb-4 sm:mb-5 hover-scale">
              <Video className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <h3 className="heading-section mb-3">{t('upload.title')}</h3>
            <p className="text-muted-sm sm:text-base leading-relaxed">
              {t('upload.subtitle')}
            </p>
          </div>

          <div className="card-interactive p-6 sm:p-8 border-2 hover:shadow-glow hover-lift group">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl w-fit mb-4 sm:mb-5 hover-scale">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <h3 className="heading-section mb-3">{t('upload.schedule')}</h3>
            <p className="text-muted-sm sm:text-base leading-relaxed">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="card-interactive p-6 sm:p-8 border-2 hover:shadow-glow hover-lift group sm:col-span-2 md:col-span-1">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl w-fit mb-4 sm:mb-5 hover-scale">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <h3 className="heading-section mb-3">{t('analytics.title')}</h3>
            <p className="text-muted-sm sm:text-base leading-relaxed">
              {t('analytics.subtitle')}
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card-elevated text-center p-8 sm:p-12 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card max-w-4xl mx-auto shadow-glow">
          <h2 className="heading-page sm:text-4xl md:text-5xl mb-4 sm:mb-6 px-4 gradient-text">
            {t('dashboard.welcome')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4 max-w-2xl mx-auto">
            {t('dashboard.subtitle')}
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")} 
            className="w-full sm:w-auto h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-primary to-primary-light hover:shadow-glow transition-all group"
          >
            {t('onboarding.getStarted')}
            <Zap className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-gap-sm">
              <div className="p-2 bg-gradient-to-br from-primary to-primary-light rounded-lg">
                <Video className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">ReelHub</span>
            </div>
            <p className="text-muted-sm text-center md:text-left">
              © 2025 ReelHub. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Button
                variant="link"
                className="text-muted-sm hover:text-primary p-0 h-auto transition-colors"
                onClick={() => navigate("/contact")}
              >
                {t('nav.contact')}
              </Button>
              <Button
                variant="link"
                className="text-muted-sm hover:text-primary p-0 h-auto transition-colors"
                onClick={() => navigate("/terms")}
              >
                Terms
              </Button>
              <Button
                variant="link"
                className="text-muted-sm hover:text-primary p-0 h-auto transition-colors"
                onClick={() => navigate("/privacy")}
              >
                Privacy
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
