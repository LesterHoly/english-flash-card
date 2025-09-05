# Environment Configuration Implementation Guide

This guide provides complete environment configuration setup for the English Flash Cards Generator project across development, staging, and production environments.

## Environment Variables Configuration

### 1. Environment Variables Schema

Create `.env.example`:

```bash
# Application Configuration
APP_NAME="English Flash Cards Generator"
APP_URL="http://localhost:3000"
APP_ENV="development"
NODE_ENV="development"

# Next.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"

# Database Configuration (for direct connections if needed)
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"

# OpenAI Configuration
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_ORGANIZATION_ID="org-your-organization-id"
OPENAI_PROJECT_ID="proj_your-project-id"

# File Storage Configuration
NEXT_PUBLIC_STORAGE_BUCKET="flash-cards"
STORAGE_ENDPOINT="https://your-project.supabase.co/storage/v1"

# Rate Limiting Configuration
RATE_LIMIT_REQUESTS_PER_MINUTE="10"
RATE_LIMIT_REQUESTS_PER_HOUR="100"
RATE_LIMIT_REQUESTS_PER_DAY="500"

# Generation Configuration
MAX_GENERATION_RETRIES="3"
GENERATION_TIMEOUT_MS="300000"
IMAGE_GENERATION_QUALITY="standard"
IMAGE_GENERATION_SIZE="1024x1024"

# Analytics Configuration
NEXT_PUBLIC_ANALYTICS_ID="your-vercel-analytics-id"
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ORG="your-organization"
SENTRY_PROJECT="english-flash-cards"

# Email Configuration (optional)
SMTP_HOST="smtp.resend.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-password"
FROM_EMAIL="noreply@your-domain.com"

# Security Configuration
ENCRYPTION_KEY="your-32-character-encryption-key"
CSRF_SECRET="your-csrf-secret-key"

# Feature Flags
FEATURE_CARD_PREVIEW="true"
FEATURE_USER_LIBRARIES="true"
FEATURE_ANALYTICS="true"
FEATURE_EMAIL_NOTIFICATIONS="false"

# Third-party Integrations
WEBHOOK_SECRET="your-webhook-secret"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### 2. Development Environment

Create `.env.local`:

```bash
# Development Environment Configuration
APP_ENV="development"
NODE_ENV="development"
APP_URL="http://localhost:3000"

# Local Supabase (when using supabase start)
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJy0WyKfUKbX9oVvhF0h4jN9TOoKj9Yy8"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Development OpenAI (use a separate project/key for dev)
OPENAI_API_KEY="sk-your-dev-openai-key"
OPENAI_ORGANIZATION_ID="org-your-dev-org-id"

# Relaxed rate limits for development
RATE_LIMIT_REQUESTS_PER_MINUTE="100"
RATE_LIMIT_REQUESTS_PER_HOUR="1000"

# Development-specific settings
MAX_GENERATION_RETRIES="1"
GENERATION_TIMEOUT_MS="60000"
IMAGE_GENERATION_QUALITY="standard"

# Disable external services in development
FEATURE_ANALYTICS="false"
FEATURE_EMAIL_NOTIFICATIONS="false"
SENTRY_DSN=""

# Development secrets (use simple values)
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
ENCRYPTION_KEY="dev-encryption-key-32-characters"
CSRF_SECRET="dev-csrf-secret"
```

### 3. Production Environment

Create production environment configuration template:

```bash
# Production Environment Configuration
APP_ENV="production"
NODE_ENV="production"
APP_URL="https://your-domain.com"

# Production Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key"
DATABASE_URL="postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres"

# Production OpenAI
OPENAI_API_KEY="sk-your-production-openai-key"
OPENAI_ORGANIZATION_ID="org-your-production-org-id"

# Production rate limits
RATE_LIMIT_REQUESTS_PER_MINUTE="10"
RATE_LIMIT_REQUESTS_PER_HOUR="100"
RATE_LIMIT_REQUESTS_PER_DAY="500"

# Production generation settings
MAX_GENERATION_RETRIES="3"
GENERATION_TIMEOUT_MS="300000"
IMAGE_GENERATION_QUALITY="hd"

# Enable all features in production
FEATURE_CARD_PREVIEW="true"
FEATURE_USER_LIBRARIES="true"
FEATURE_ANALYTICS="true"
FEATURE_EMAIL_NOTIFICATIONS="true"

# Production monitoring
NEXT_PUBLIC_ANALYTICS_ID="your-vercel-analytics-id"
SENTRY_DSN="https://your-production-sentry-dsn@sentry.io/project-id"

# Strong production secrets (use secure random generation)
NEXTAUTH_SECRET="your-secure-nextauth-secret-64-chars-minimum"
ENCRYPTION_KEY="your-secure-32-character-encryption-key"
CSRF_SECRET="your-secure-csrf-secret-key"

# Production payment processing
STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-key"
STRIPE_SECRET_KEY="sk_live_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-production-webhook-secret"
```

## Configuration Management

### 1. Environment Configuration Helper

Create `src/config/env.ts`:

```typescript
import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // App configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_URL: z.string().url(),
  
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().optional(),
  
  // OpenAI configuration
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  OPENAI_ORGANIZATION_ID: z.string().startsWith('org-').optional(),
  OPENAI_PROJECT_ID: z.string().startsWith('proj_').optional(),
  
  // Rate limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.coerce.number().default(10),
  RATE_LIMIT_REQUESTS_PER_HOUR: z.coerce.number().default(100),
  RATE_LIMIT_REQUESTS_PER_DAY: z.coerce.number().default(500),
  
  // Generation settings
  MAX_GENERATION_RETRIES: z.coerce.number().default(3),
  GENERATION_TIMEOUT_MS: z.coerce.number().default(300000),
  IMAGE_GENERATION_QUALITY: z.enum(['standard', 'hd']).default('standard'),
  IMAGE_GENERATION_SIZE: z.enum(['1024x1024', '1024x1792', '1792x1024']).default('1024x1024'),
  
  // Feature flags
  FEATURE_CARD_PREVIEW: z.coerce.boolean().default(true),
  FEATURE_USER_LIBRARIES: z.coerce.boolean().default(true),
  FEATURE_ANALYTICS: z.coerce.boolean().default(false),
  FEATURE_EMAIL_NOTIFICATIONS: z.coerce.boolean().default(false),
  
  // Security
  NEXTAUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),
  CSRF_SECRET: z.string().min(16),
  
  // Optional monitoring
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  
  // Optional payment processing
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      
      throw new Error(`Invalid environment configuration:\n${missingVars}`);
    }
    throw error;
  }
}

// Export validated environment configuration
export const env = parseEnv();

// Type-safe environment access
export type Environment = z.infer<typeof envSchema>;

// Helper functions for environment-specific logic
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isStaging = env.APP_ENV === 'staging';

// Configuration objects for different services
export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

export const openaiConfig = {
  apiKey: env.OPENAI_API_KEY,
  organization: env.OPENAI_ORGANIZATION_ID,
  project: env.OPENAI_PROJECT_ID,
} as const;

export const rateLimitConfig = {
  requestsPerMinute: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
  requestsPerHour: env.RATE_LIMIT_REQUESTS_PER_HOUR,
  requestsPerDay: env.RATE_LIMIT_REQUESTS_PER_DAY,
} as const;

export const generationConfig = {
  maxRetries: env.MAX_GENERATION_RETRIES,
  timeoutMs: env.GENERATION_TIMEOUT_MS,
  imageQuality: env.IMAGE_GENERATION_QUALITY,
  imageSize: env.IMAGE_GENERATION_SIZE,
} as const;

export const featureFlags = {
  cardPreview: env.FEATURE_CARD_PREVIEW,
  userLibraries: env.FEATURE_USER_LIBRARIES,
  analytics: env.FEATURE_ANALYTICS,
  emailNotifications: env.FEATURE_EMAIL_NOTIFICATIONS,
} as const;
```

### 2. Runtime Configuration Validation

Create `src/config/validate.ts`:

```typescript
import { env, supabaseConfig, openaiConfig } from './env';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateEnvironment(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate Supabase connection
  try {
    const response = await fetch(`${supabaseConfig.url}/rest/v1/`, {
      headers: {
        'apikey': supabaseConfig.anonKey,
        'Authorization': `Bearer ${supabaseConfig.anonKey}`,
      },
    });
    
    if (!response.ok) {
      errors.push('Supabase connection failed');
    }
  } catch (error) {
    errors.push(`Supabase connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate OpenAI API key
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiConfig.apiKey}`,
      },
    });
    
    if (!response.ok) {
      errors.push('OpenAI API key validation failed');
    }
  } catch (error) {
    errors.push(`OpenAI API validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Environment-specific validations
  if (env.NODE_ENV === 'production') {
    // Production-specific validations
    if (!env.SENTRY_DSN) {
      warnings.push('Sentry DSN not configured for production');
    }
    
    if (!env.NEXT_PUBLIC_ANALYTICS_ID) {
      warnings.push('Analytics not configured for production');
    }
    
    if (env.NEXTAUTH_SECRET === 'dev-secret-key-change-in-production') {
      errors.push('Default development secret used in production');
    }
    
    if (env.ENCRYPTION_KEY === 'dev-encryption-key-32-characters') {
      errors.push('Default development encryption key used in production');
    }
  }

  // Feature flag consistency checks
  if (env.FEATURE_EMAIL_NOTIFICATIONS && !env.SMTP_HOST) {
    warnings.push('Email notifications enabled but SMTP not configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Startup validation middleware
export function createValidationMiddleware() {
  return async function validateOnStartup() {
    console.log('🔍 Validating environment configuration...');
    
    const result = await validateEnvironment();
    
    if (result.warnings.length > 0) {
      console.warn('⚠️  Environment warnings:');
      result.warnings.forEach(warning => console.warn(`   - ${warning}`));
    }
    
    if (!result.isValid) {
      console.error('❌ Environment validation failed:');
      result.errors.forEach(error => console.error(`   - ${error}`));
      
      if (env.NODE_ENV === 'production') {
        throw new Error('Environment validation failed in production');
      }
    } else {
      console.log('✅ Environment configuration validated successfully');
    }
  };
}
```

### 3. Development Setup Script

Create `scripts/setup-dev.sh`:

```bash
#!/bin/bash

# English Flash Cards Generator - Development Setup Script
set -e

echo "🚀 Setting up English Flash Cards Generator development environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual API keys and configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup Supabase
if command -v supabase &> /dev/null; then
    echo "🗄️  Setting up local Supabase..."
    supabase start
    
    echo "🔑 Running database setup..."
    supabase db reset --local
    psql -h localhost -p 54322 -U postgres -d postgres -f database/setup.sql
    psql -h localhost -p 54322 -U postgres -d postgres -f database/rls.sql
    psql -h localhost -p 54322 -U postgres -d postgres -f database/functions.sql
    psql -h localhost -p 54322 -U postgres -d postgres -f database/seed.sql
else
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g @supabase/cli"
    exit 1
fi

# Validate environment
echo "🔍 Validating environment configuration..."
npm run validate-env

echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env.local with your OpenAI API key"
echo "   2. Run 'npm run dev' to start the development server"
echo "   3. Visit http://localhost:3000 to view the application"
```

### 4. Environment-Specific Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "setup-dev": "chmod +x scripts/setup-dev.sh && ./scripts/setup-dev.sh",
    "validate-env": "tsx src/config/validate.ts",
    "db:setup": "supabase db reset --local && psql -h localhost -p 54322 -U postgres -d postgres -f database/setup.sql",
    "db:migrate": "supabase migration up",
    "db:seed": "psql -h localhost -p 54322 -U postgres -d postgres -f database/seed.sql",
    "env:check": "tsx scripts/check-env.ts",
    "env:generate-keys": "tsx scripts/generate-keys.ts"
  }
}
```

### 5. Key Generation Utility

Create `scripts/generate-keys.ts`:

```typescript
import crypto from 'crypto';

interface GeneratedKeys {
  nextAuthSecret: string;
  encryptionKey: string;
  csrfSecret: string;
  webhookSecret: string;
}

function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

function generateKeys(): GeneratedKeys {
  return {
    nextAuthSecret: generateSecureKey(32),
    encryptionKey: generateSecureKey(16), // 32 chars hex = 16 bytes
    csrfSecret: generateSecureKey(24),
    webhookSecret: generateSecureKey(32),
  };
}

function main() {
  console.log('🔐 Generating secure keys for production deployment...\n');
  
  const keys = generateKeys();
  
  console.log('Add these to your production environment variables:');
  console.log('=====================================================\n');
  console.log(`NEXTAUTH_SECRET="${keys.nextAuthSecret}"`);
  console.log(`ENCRYPTION_KEY="${keys.encryptionKey}"`);
  console.log(`CSRF_SECRET="${keys.csrfSecret}"`);
  console.log(`WEBHOOK_SECRET="${keys.webhookSecret}"`);
  console.log('\n⚠️  Store these keys securely and never commit them to version control!');
}

if (require.main === module) {
  main();
}
```

### 6. Docker Environment Configuration

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - APP_URL=http://localhost:3000
    env_file:
      - .env.local
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: flash_cards_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 7. Vercel Deployment Configuration

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "env": {
    "NODE_ENV": "production",
    "APP_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin/dashboard",
      "permanent": false
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-domain.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        }
      ]
    }
  ]
}
```

## Setup Instructions

### 1. Development Setup

```bash
# Clone repository and navigate to project
git clone <repository-url>
cd english-flash-card

# Install dependencies
npm install

# Setup environment
npm run setup-dev

# Start development server
npm run dev
```

### 2. Production Deployment

```bash
# Generate production keys
npm run env:generate-keys

# Set up Vercel environment variables
vercel env add NEXTAUTH_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add OPENAI_API_KEY production
# ... add all required production environment variables

# Deploy to Vercel
vercel --prod
```

### 3. Environment Variable Management

Use these tools to manage environment variables across different environments:

- **Development**: `.env.local` (gitignored)
- **Staging**: Vercel dashboard or `vercel env add <key> preview`
- **Production**: Vercel dashboard or `vercel env add <key> production`

### 4. Security Best Practices

- Never commit `.env.local` or any file containing real API keys
- Use different OpenAI projects/keys for development and production
- Rotate secrets regularly in production
- Use Vercel's environment variable encryption
- Enable audit logging for environment variable changes

This comprehensive environment configuration setup ensures secure, scalable, and maintainable deployment across all environments while providing type-safe access to configuration throughout the application.