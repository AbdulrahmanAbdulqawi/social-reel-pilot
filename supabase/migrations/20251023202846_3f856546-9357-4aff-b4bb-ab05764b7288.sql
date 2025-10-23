-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('free_trial', 'premium');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'expired');

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan_type subscription_plan NOT NULL DEFAULT 'free_trial',
  status subscription_status NOT NULL DEFAULT 'active',
  posts_limit INTEGER NOT NULL DEFAULT 5,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 month'),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to create free trial subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, status, posts_limit)
  VALUES (NEW.id, 'free_trial', 'active', 5);
  RETURN NEW;
END;
$$;

-- Trigger to auto-create subscription on user signup
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Function to check if user can create a post
CREATE OR REPLACE FUNCTION public.can_user_create_post(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan subscription_plan;
  user_limit INTEGER;
  current_month_posts INTEGER;
  period_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's subscription info
  SELECT plan_type, posts_limit, current_period_start
  INTO user_plan, user_limit, period_start
  FROM user_subscriptions
  WHERE user_id = user_id_param AND status = 'active';
  
  -- If no subscription found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If premium plan, always allow
  IF user_plan = 'premium' THEN
    RETURN TRUE;
  END IF;
  
  -- Count posts in current period for free trial users
  SELECT COUNT(*)
  INTO current_month_posts
  FROM reels
  WHERE user_id = user_id_param 
    AND created_at >= period_start
    AND created_at < (period_start + interval '1 month');
  
  -- Check if under limit
  RETURN current_month_posts < user_limit;
END;
$$;

-- Function to get user's remaining posts
CREATE OR REPLACE FUNCTION public.get_remaining_posts(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan subscription_plan;
  user_limit INTEGER;
  current_month_posts INTEGER;
  period_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's subscription info
  SELECT plan_type, posts_limit, current_period_start
  INTO user_plan, user_limit, period_start
  FROM user_subscriptions
  WHERE user_id = user_id_param AND status = 'active';
  
  -- If premium plan, return -1 (unlimited)
  IF user_plan = 'premium' THEN
    RETURN -1;
  END IF;
  
  -- Count posts in current period
  SELECT COUNT(*)
  INTO current_month_posts
  FROM reels
  WHERE user_id = user_id_param 
    AND created_at >= period_start
    AND created_at < (period_start + interval '1 month');
  
  -- Return remaining posts
  RETURN GREATEST(0, user_limit - current_month_posts);
END;
$$;

-- Trigger to update updated_at on user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();