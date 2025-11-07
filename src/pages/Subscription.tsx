import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, Zap } from "lucide-react";

export default function Subscription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subscription details"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType: 'free_trial' | 'premium') => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          plan_type: planType,
          posts_limit: planType === 'premium' ? -1 : 5
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        variant: "success",
        title: "Success",
        description: `Successfully upgraded to ${planType === 'premium' ? 'Premium' : 'Free Trial'} plan`
      });

      await loadSubscription();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const plans = [
    {
      name: "Free Trial",
      type: "free_trial" as const,
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "5 posts per month",
        "Basic analytics",
        "Single platform posting",
        "Community support"
      ],
      icon: Sparkles,
      popular: false
    },
    {
      name: "Premium",
      type: "premium" as const,
      price: "$19",
      period: "per month",
      description: "For serious content creators",
      features: [
        "Unlimited posts",
        "Advanced analytics",
        "Multi-platform posting",
        "Priority support",
        "Scheduled posting",
        "Custom branding"
      ],
      icon: Zap,
      popular: true
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">
            Select the plan that best fits your content creation needs
          </p>
        </div>

        {/* Current Plan */}
        {subscription && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the{" "}
                <span className="font-semibold text-foreground capitalize">
                  {subscription.plan_type.replace('_', ' ')}
                </span>{" "}
                plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-sm">
                  Status: {subscription.status}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {subscription.posts_limit === -1 
                    ? "Unlimited posts" 
                    : `${subscription.posts_limit} posts/month`}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.plan_type === plan.type;

            return (
              <Card 
                key={plan.type}
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${
                  isCurrentPlan ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(plan.type)}
                    disabled={isCurrentPlan}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Need a custom plan for your team?{" "}
            <Button variant="link" className="p-0 h-auto">
              Contact us
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
