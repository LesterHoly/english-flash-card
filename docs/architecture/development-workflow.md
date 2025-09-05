# Development Workflow

## Local Development Setup

### Prerequisites
```bash
# Required software installations
node --version  # v18.17.0 or higher
npm --version   # v9.0.0 or higher
git --version   # v2.34.0 or higher

# Install Node.js via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installations
node --version && npm --version && git --version
```

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd english-flash-card

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit environment variables (see Environment Configuration section)
nano .env.local

# Set up Supabase project
npx supabase start
npx supabase db reset

# Run database migrations
npm run db:migrate

# Seed development data (optional)
npm run db:seed

# Generate TypeScript types from Supabase
npm run types:generate
```

### Development Commands
```bash
# Start all services in development mode
npm run dev

# Start frontend only (http://localhost:3000)
npm run dev:web

# Start database only (Supabase local)
npm run dev:db

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:e2e          # End-to-end tests
npm run test:coverage     # Coverage report

# Build for production
npm run build

# Preview production build
npm run start
```

## Environment Configuration

### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Configuration
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_DATABASE_URL=your_supabase_database_url

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION=your_openai_org_id

# Authentication
AUTH_SECRET=your_auth_secret_key

# Storage
NEXT_PUBLIC_STORAGE_BUCKET=flash-cards-storage

# Monitoring and Analytics
SENTRY_DSN=your_sentry_dsn
VERCEL_ANALYTICS_ID=your_vercel_analytics_id

# Feature Flags
ENABLE_PREVIEW_FEATURE=true
ENABLE_CATEGORY_CARDS=true
ENABLE_ADVANCED_GENERATION=false

# Rate Limiting
OPENAI_RATE_LIMIT_RPM=60
MAX_CARDS_PER_USER_DAILY=50
```
