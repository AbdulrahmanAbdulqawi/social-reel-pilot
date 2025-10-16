-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE platform_type AS ENUM ('instagram', 'tiktok', 'youtube');
CREATE TYPE reel_status AS ENUM ('draft', 'scheduled', 'posted', 'failed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create reels table
CREATE TABLE public.reels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[],
  video_url TEXT,
  thumbnail_url TEXT,
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  platform platform_type NOT NULL,
  status reel_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Reels RLS policies
CREATE POLICY "Users can view their own reels"
  ON public.reels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reels"
  ON public.reels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reels"
  ON public.reels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reels"
  ON public.reels FOR DELETE
  USING (auth.uid() = user_id);

-- Create platform_accounts table
CREATE TABLE public.platform_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.platform_accounts ENABLE ROW LEVEL SECURITY;

-- Platform accounts RLS policies
CREATE POLICY "Users can view their own platform accounts"
  ON public.platform_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own platform accounts"
  ON public.platform_accounts FOR ALL
  USING (auth.uid() = user_id);

-- Create reel_analytics table
CREATE TABLE public.reel_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  platform_response_id TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reel_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics RLS policies (users can see analytics for their own reels)
CREATE POLICY "Users can view analytics for their own reels"
  ON public.reel_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reels
      WHERE reels.id = reel_analytics.reel_id
      AND reels.user_id = auth.uid()
    )
  );

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true);

-- Storage policies for reels bucket
CREATE POLICY "Users can upload their own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reels' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reels');

CREATE POLICY "Users can update their own videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'reels' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reels' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reels_updated_at
  BEFORE UPDATE ON public.reels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();