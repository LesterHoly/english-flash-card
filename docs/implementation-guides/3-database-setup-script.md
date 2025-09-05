# Database Setup Script Implementation Guide

This guide provides complete database setup scripts for the English Flash Cards Generator project using Supabase PostgreSQL with Row Level Security (RLS).

## Complete Database Setup Script

### 1. Main Setup Script

Create `database/setup.sql`:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create enum types
CREATE TYPE card_type AS ENUM ('single_word', 'category');
CREATE TYPE card_status AS ENUM ('generating', 'preview', 'approved', 'downloaded', 'failed');
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE age_group AS ENUM ('preschool', 'elementary', 'middle_school');
CREATE TYPE style_preference AS ENUM ('cartoon', 'realistic', 'minimalist');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    generation_credits INTEGER DEFAULT 10,
    preferences JSONB DEFAULT '{
        "language": "en",
        "default_difficulty": "beginner",
        "default_age_group": "elementary",
        "default_style": "cartoon",
        "skip_preview": false,
        "auto_download": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flash cards table
CREATE TABLE IF NOT EXISTS flash_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    card_type card_type NOT NULL,
    status card_status DEFAULT 'generating',
    
    -- Card content (JSONB for flexible schema)
    content JSONB NOT NULL DEFAULT '{
        "primary_word": "",
        "scenes": [],
        "category_words": [],
        "layout": {
            "format": "3:4",
            "orientation": "portrait",
            "theme": "bright"
        }
    }'::jsonb,
    
    -- Generation parameters
    generation_params JSONB NOT NULL DEFAULT '{
        "difficulty_level": "beginner",
        "age_group": "elementary", 
        "style_preference": "cartoon",
        "language": "en"
    }'::jsonb,
    
    -- Metadata
    file_path TEXT,
    file_size INTEGER,
    download_count INTEGER DEFAULT 0,
    regeneration_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_content CHECK (
        content ? 'primary_word' AND 
        content ? 'scenes' AND
        content ? 'layout'
    ),
    CONSTRAINT valid_generation_params CHECK (
        generation_params ? 'difficulty_level' AND
        generation_params ? 'age_group' AND
        generation_params ? 'style_preference' AND
        generation_params ? 'language'
    )
);

-- Generation sessions table (tracks async generation process)
CREATE TABLE IF NOT EXISTS generation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input_prompt TEXT NOT NULL,
    card_type card_type NOT NULL,
    status generation_status DEFAULT 'pending',
    
    -- Generation parameters
    generation_params JSONB NOT NULL,
    
    -- Processing data
    openai_request_id TEXT,
    processing_steps JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Results
    generated_card_ids UUID[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT max_retries CHECK (retry_count <= 3),
    CONSTRAINT valid_status_completed CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- User libraries table (collections of cards)
CREATE TABLE IF NOT EXISTS user_libraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    card_ids UUID[] DEFAULT ARRAY[]::UUID[],
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Usage analytics table
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'card_generated', 'card_downloaded', 'card_regenerated', 
        'preview_opened', 'preview_approved', 'settings_changed'
    )),
    event_data JSONB DEFAULT '{}'::jsonb,
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for analytics queries
    INDEX idx_usage_analytics_user_event (user_id, event_type, created_at),
    INDEX idx_usage_analytics_created_at (created_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flash_cards_user_id ON flash_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_cards_status ON flash_cards(status);
CREATE INDEX IF NOT EXISTS idx_flash_cards_created_at ON flash_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flash_cards_user_status ON flash_cards(user_id, status);

CREATE INDEX IF NOT EXISTS idx_generation_sessions_user_id ON generation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_sessions_status ON generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_generation_sessions_created_at ON generation_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_libraries_user_id ON user_libraries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_libraries_default ON user_libraries(user_id, is_default) WHERE is_default = true;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flash_cards_updated_at BEFORE UPDATE ON flash_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_sessions_updated_at BEFORE UPDATE ON generation_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_libraries_updated_at BEFORE UPDATE ON user_libraries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Row Level Security (RLS) Setup

Create `database/rls.sql`:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Flash cards table policies
CREATE POLICY "Users can view own cards" ON flash_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" ON flash_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON flash_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON flash_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Generation sessions table policies
CREATE POLICY "Users can view own generation sessions" ON generation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation sessions" ON generation_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generation sessions" ON generation_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- User libraries table policies
CREATE POLICY "Users can view own libraries" ON user_libraries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own libraries" ON user_libraries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own libraries" ON user_libraries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own libraries" ON user_libraries
    FOR DELETE USING (auth.uid() = user_id);

-- Usage analytics table policies (read-only for users)
CREATE POLICY "Users can view own analytics" ON usage_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert analytics" ON usage_analytics
    FOR INSERT WITH CHECK (true);
```

### 3. Database Functions

Create `database/functions.sql`:

```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.created_at
    );
    
    -- Create default library
    INSERT INTO user_libraries (user_id, name, description, is_default)
    VALUES (
        NEW.id,
        'My Cards',
        'Default library for generated cards',
        true
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update generation credits
CREATE OR REPLACE FUNCTION update_user_credits(
    p_user_id UUID,
    p_credit_change INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    new_credits INTEGER;
BEGIN
    UPDATE users 
    SET generation_credits = generation_credits + p_credit_change
    WHERE id = p_user_id
    RETURNING generation_credits INTO new_credits;
    
    RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add card to library
CREATE OR REPLACE FUNCTION add_card_to_library(
    p_user_id UUID,
    p_library_id UUID,
    p_card_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verify library ownership
    IF NOT EXISTS (
        SELECT 1 FROM user_libraries 
        WHERE id = p_library_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Library not found or access denied';
    END IF;
    
    -- Verify card ownership  
    IF NOT EXISTS (
        SELECT 1 FROM flash_cards 
        WHERE id = p_card_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Card not found or access denied';
    END IF;
    
    -- Add card to library (avoid duplicates)
    UPDATE user_libraries
    SET card_ids = array_append(card_ids, p_card_id)
    WHERE id = p_library_id 
    AND NOT (p_card_id = ANY(card_ids));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log usage events
CREATE OR REPLACE FUNCTION log_usage_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT '{}'::jsonb,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO usage_analytics (
        user_id,
        event_type,
        event_data,
        session_id
    ) VALUES (
        p_user_id,
        p_event_type,
        p_event_data,
        p_session_id
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM generation_sessions
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

### 4. Seed Data Script

Create `database/seed.sql`:

```sql
-- Insert sample user preferences templates
INSERT INTO users (id, email, full_name, subscription_tier, generation_credits, preferences)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@example.com',
    'Demo User',
    'pro',
    100,
    '{
        "language": "en",
        "default_difficulty": "intermediate", 
        "default_age_group": "elementary",
        "default_style": "cartoon",
        "skip_preview": false,
        "auto_download": true,
        "preferred_themes": ["bright", "colorful"],
        "notification_preferences": {
            "email_on_completion": true,
            "email_weekly_summary": false
        }
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert sample card for testing
INSERT INTO flash_cards (
    id,
    user_id,
    title,
    card_type,
    status,
    content,
    generation_params
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Sample Elephant Card',
    'single_word',
    'approved',
    '{
        "primary_word": "elephant",
        "scenes": [
            {
                "id": "scene_1",
                "description": "A big gray elephant in the savanna",
                "image_url": "/images/sample/elephant_1.jpg",
                "image_prompt": "A large gray elephant standing in African savanna grassland, cartoon style, bright colors, child-friendly"
            },
            {
                "id": "scene_2", 
                "description": "An elephant family drinking water",
                "image_url": "/images/sample/elephant_2.jpg",
                "image_prompt": "Elephant family with baby elephant drinking at a watering hole, cartoon style, warm colors"
            },
            {
                "id": "scene_3",
                "description": "An elephant eating leaves from a tree", 
                "image_url": "/images/sample/elephant_3.jpg",
                "image_prompt": "Elephant reaching up with trunk to eat leaves from acacia tree, cartoon style, green landscape"
            },
            {
                "id": "scene_4",
                "description": "An elephant spraying water with its trunk",
                "image_url": "/images/sample/elephant_4.jpg", 
                "image_prompt": "Happy elephant spraying water from trunk, splashing around, cartoon style, blue and green colors"
            }
        ],
        "layout": {
            "format": "3:4",
            "orientation": "portrait",
            "theme": "bright"
        }
    }'::jsonb,
    '{
        "difficulty_level": "beginner",
        "age_group": "elementary",
        "style_preference": "cartoon", 
        "language": "en"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create default library for demo user
INSERT INTO user_libraries (
    user_id,
    name,
    description,
    card_ids,
    is_default
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Sample Cards',
    'Demo library with sample cards',
    ARRAY['00000000-0000-0000-0000-000000000002']::UUID[],
    true
) ON CONFLICT (user_id, name) DO NOTHING;
```

## Setup Instructions

### 1. Local Development Setup

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Initialize Supabase project
supabase init

# Start local development
supabase start

# Run setup scripts
supabase db reset --local
psql -h localhost -p 54322 -U postgres -d postgres -f database/setup.sql
psql -h localhost -p 54322 -U postgres -d postgres -f database/rls.sql  
psql -h localhost -p 54322 -U postgres -d postgres -f database/functions.sql
psql -h localhost -p 54322 -U postgres -d postgres -f database/seed.sql
```

### 2. Production Deployment

```bash
# Link to production project
supabase link --project-ref your-project-ref

# Push database changes
supabase db push

# Run migrations
supabase migration up
```

### 3. Environment-Specific Scripts

Create `database/environments/development.sql`:

```sql
-- Development-specific settings
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 0;

-- Create test users for development
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'test@example.com', 
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(), 
    NOW()
) ON CONFLICT (id) DO NOTHING;
```

Create `database/environments/production.sql`:

```sql
-- Production optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Create scheduled cleanup job
SELECT cron.schedule('cleanup-old-sessions', '0 2 * * *', 'SELECT cleanup_old_sessions();');
```

### 4. Migration Management

Create `database/migrations/001_initial_setup.sql`:

```sql
-- Migration: Initial database setup
-- Created: 2025-09-04
-- Description: Create all tables, indexes, and RLS policies

\i setup.sql
\i rls.sql  
\i functions.sql
```

### 5. Database Validation Script

Create `database/validate.sql`:

```sql
-- Validation queries to ensure setup is correct
DO $$
BEGIN
    -- Check all tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Users table not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flash_cards') THEN
        RAISE EXCEPTION 'Flash cards table not found';
    END IF;
    
    -- Check RLS is enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'users' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on users table';
    END IF;
    
    -- Check functions exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) THEN
        RAISE EXCEPTION 'handle_new_user function not found';
    END IF;
    
    RAISE NOTICE 'Database validation passed successfully!';
END
$$;
```

## Usage Examples

### Creating a New Card

```sql
-- Insert new generation session
INSERT INTO generation_sessions (
    user_id,
    input_prompt,
    card_type,
    generation_params
) VALUES (
    auth.uid(),
    'elephant',
    'single_word',
    '{"difficulty_level": "beginner", "age_group": "elementary", "style_preference": "cartoon", "language": "en"}'::jsonb
);

-- Update session when generation completes
UPDATE generation_sessions 
SET status = 'completed',
    completed_at = NOW(),
    generated_card_ids = ARRAY['card-uuid']::UUID[]
WHERE id = 'session-uuid';
```

### Querying User Cards

```sql
-- Get all cards for current user
SELECT 
    fc.*,
    gs.input_prompt,
    gs.created_at as generated_at
FROM flash_cards fc
LEFT JOIN generation_sessions gs ON fc.id = ANY(gs.generated_card_ids)
WHERE fc.user_id = auth.uid()
ORDER BY fc.created_at DESC;

-- Get cards by status
SELECT * FROM flash_cards 
WHERE user_id = auth.uid() 
AND status = 'preview'
ORDER BY created_at ASC;
```

This comprehensive database setup provides a robust foundation for the English Flash Cards Generator with proper security, performance optimization, and data integrity constraints.