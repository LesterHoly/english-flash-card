# Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    subscription_tier TEXT CHECK (subscription_tier IN ('free', 'educator', 'premium')) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    skip_preview BOOLEAN DEFAULT false,
    default_card_type TEXT CHECK (default_card_type IN ('single_word', 'category')) DEFAULT 'single_word',
    theme TEXT CHECK (theme IN ('light', 'dark')) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Generation sessions table
CREATE TABLE public.generation_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    input_prompt TEXT NOT NULL,
    generation_type TEXT CHECK (generation_type IN ('single_word_card', 'category_card', 'regeneration')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    error_message TEXT,
    ai_costs JSONB DEFAULT '{"text_tokens": 0, "image_generations": 0, "total_cost_usd": 0.0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    INDEX (user_id, created_at DESC),
    INDEX (status, created_at)
);

-- Flash cards table
CREATE TABLE public.flash_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.generation_sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    card_type TEXT CHECK (card_type IN ('single_word', 'category')) NOT NULL,
    status TEXT CHECK (status IN ('generating', 'preview', 'approved', 'downloaded')) DEFAULT 'generating',
    content JSONB NOT NULL,
    generation_params JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX (user_id, created_at DESC),
    INDEX (user_id, card_type),
    INDEX (status, created_at)
);

-- Card scenes table (normalized for better querying and storage efficiency)
CREATE TABLE public.card_scenes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    card_id UUID REFERENCES public.flash_cards(id) ON DELETE CASCADE NOT NULL,
    scene_order INTEGER NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    image_prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(card_id, scene_order),
    INDEX (card_id, scene_order)
);

-- User usage tracking for quotas and billing
CREATE TABLE public.usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    cards_generated INTEGER DEFAULT 0,
    total_ai_cost DECIMAL(10,4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, period_start),
    INDEX (user_id, period_start DESC)
);

-- Row Level Security Policies

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Generation sessions policies
CREATE POLICY "Users can view own sessions" ON public.generation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.generation_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.generation_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Flash cards policies
CREATE POLICY "Users can manage own cards" ON public.flash_cards
    FOR ALL USING (auth.uid() = user_id);

-- Card scenes policies
CREATE POLICY "Users can manage scenes of own cards" ON public.card_scenes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.flash_cards 
            WHERE flash_cards.id = card_scenes.card_id 
            AND flash_cards.user_id = auth.uid()
        )
    );

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Functions and Triggers

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_cards_updated_at
    BEFORE UPDATE ON public.flash_cards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_usage_updated_at
    BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create user preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create preferences when user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance optimization
CREATE INDEX CONCURRENTLY idx_flash_cards_user_status ON public.flash_cards(user_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_sessions_user_type ON public.generation_sessions(user_id, generation_type, created_at DESC);
CREATE INDEX CONCURRENTLY idx_usage_period ON public.usage_tracking(user_id, period_start DESC);

-- Views for common queries
CREATE VIEW public.user_card_summary AS
SELECT 
    u.id as user_id,
    u.name,
    COUNT(fc.id) as total_cards,
    COUNT(CASE WHEN fc.status = 'approved' THEN 1 END) as approved_cards,
    COUNT(CASE WHEN fc.status = 'downloaded' THEN 1 END) as downloaded_cards,
    MAX(fc.created_at) as last_card_created
FROM public.users u
LEFT JOIN public.flash_cards fc ON u.id = fc.user_id
GROUP BY u.id, u.name;
```
