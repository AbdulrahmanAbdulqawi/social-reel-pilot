import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Calendar, Link2, BarChart3, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const getMilestones = (t: any) => [
  {
    id: 1,
    title: t('onboarding.uploadFirstReel'),
    description: t('onboarding.uploadFirstReelDesc'),
    icon: Upload,
    route: "/upload",
    color: "from-primary to-primary-light"
  },
  {
    id: 2,
    title: t('onboarding.schedulePosts'),
    description: t('onboarding.schedulePostsDesc'),
    icon: Calendar,
    route: "/dashboard",
    color: "from-primary-light to-primary-glow"
  },
  {
    id: 3,
    title: t('onboarding.connectPlatformsTitle'),
    description: t('onboarding.connectPlatformsDesc'),
    icon: Link2,
    route: "/settings",
    color: "from-primary-glow to-primary"
  },
  {
    id: 4,
    title: t('onboarding.trackAnalyticsTitle'),
    description: t('onboarding.trackAnalyticsDesc'),
    icon: BarChart3,
    route: "/analytics",
    color: "from-primary to-primary-glow"
  }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const MILESTONES = getMilestones(t);

  useEffect(() => {
    // Load progress from database
    const loadProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("onboarding_step, onboarding_completed")
          .eq("id", user.id)
          .single();

        if (data?.onboarding_completed) {
          navigate("/dashboard");
          return;
        }

        if (data?.onboarding_step) {
          setCurrentStep(data.onboarding_step);
          setCompletedSteps(Array.from({ length: data.onboarding_step }, (_, i) => i));
        }
      }
    };

    loadProgress();
  }, [navigate]);

  const saveProgress = async (step: number, completed: boolean = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          onboarding_step: step,
          onboarding_completed: completed,
          onboarding_started_at: new Date().toISOString()
        })
        .eq("id", user.id);
    }
  };

  const handleStepComplete = async () => {
    const newCompletedSteps = [...completedSteps, currentStep];
    setCompletedSteps(newCompletedSteps);
    
    toast.success(`✅ ${MILESTONES[currentStep].title} completed!`);

    if (currentStep === MILESTONES.length - 1) {
      // Final step - just move forward but don't auto-complete
      setCurrentStep(currentStep + 1);
      await saveProgress(currentStep + 1);
    } else {
      setCurrentStep(currentStep + 1);
      await saveProgress(currentStep + 1);
    }
  };

  const handleFinishOnboarding = async () => {
    setShowCelebration(true);
    await saveProgress(MILESTONES.length, true);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B8000', '#FFD700', '#FFF']
    });

    setTimeout(() => {
      toast.success(`🎉 ${t('onboarding.congratsMessage')}`);
      navigate("/dashboard");
    }, 2000);
  };

  const handleSkip = async () => {
    await saveProgress(MILESTONES.length, true);
    toast.info(t('onboarding.revisitTutorial'));
    navigate("/dashboard");
  };

  const handleGoToFeature = () => {
    const milestone = MILESTONES[currentStep];
    navigate(milestone.route);
  };

  const progress = ((completedSteps.length) / MILESTONES.length) * 100;
  const currentMilestone = MILESTONES[currentStep];
  const Icon = currentMilestone?.icon || Sparkles;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-4xl shadow-glow animate-scale-in relative z-10">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className={`p-4 bg-gradient-to-br ${currentMilestone?.color || 'from-primary to-primary-light'} rounded-2xl shadow-glow animate-fade-in`}>
                <Icon className="w-12 h-12 text-background" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary-light to-primary-glow bg-clip-text text-transparent">
              {t('onboarding.welcome')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('onboarding.journeyStarts')}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                {t('onboarding.step')} {completedSteps.length}/{MILESTONES.length}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Journey Map */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {MILESTONES.map((milestone, index) => {
              const MilestoneIcon = milestone.icon;
              const isCompleted = completedSteps.includes(index);
              const isCurrent = currentStep === index;
              const isLocked = index > currentStep;

              return (
                <div
                  key={milestone.id}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    isCompleted
                      ? "border-primary bg-primary/10 shadow-glow"
                      : isCurrent
                      ? "border-primary bg-card animate-pulse"
                      : "border-border bg-card/50 opacity-50"
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`p-3 rounded-full ${
                        isCompleted
                          ? "bg-primary text-background"
                          : isCurrent
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <MilestoneIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{milestone.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Step Details */}
          {currentMilestone && !showCelebration && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in">
              <h2 className="text-2xl font-bold mb-2">{currentMilestone.title}</h2>
              <p className="text-muted-foreground mb-4">{currentMilestone.description}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleGoToFeature}
                  className="flex-1 bg-gradient-to-r from-primary to-primary-light hover:shadow-glow transition-all"
                  size="lg"
                >
                  {t('onboarding.exploreFeature')}
                </Button>
                <Button
                  onClick={handleStepComplete}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  {t('onboarding.markComplete')}
                </Button>
              </div>
            </div>
          )}

          {/* All Steps Completed - Show Finish Button */}
          {!currentMilestone && !showCelebration && completedSteps.length === MILESTONES.length && (
            <div className="bg-card border border-primary rounded-lg p-6 mb-6 animate-fade-in text-center">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-primary-light to-primary-glow bg-clip-text text-transparent">
                {t('onboarding.allStepsCompleted')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('onboarding.allStepsCompletedDesc')}
              </p>
              <Button
                onClick={handleFinishOnboarding}
                className="bg-gradient-to-r from-primary to-primary-light hover:shadow-glow transition-all"
                size="lg"
              >
                {t('onboarding.finishStart')}
              </Button>
            </div>
          )}

          {/* Celebration State */}
          {showCelebration && (
            <div className="text-center animate-scale-in">
              <div className="mb-4">
                <Sparkles className="w-20 h-20 mx-auto text-primary animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-primary-light to-primary-glow bg-clip-text text-transparent">
                {t('onboarding.congratsMessage')}
              </h2>
              <p className="text-muted-foreground text-lg">
                {t('onboarding.congratsDesc')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-border">
            <Button
              onClick={handleSkip}
              variant="ghost"
              disabled={isLoading || showCelebration}
            >
              {t('onboarding.skipTutorial')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t('onboarding.step')} {currentStep + 1} {t('onboarding.of')} {MILESTONES.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
