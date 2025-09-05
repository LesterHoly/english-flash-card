# Tech Stack

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | ^5.2.0 | Type-safe development | Essential for maintainable educational software with complex AI integrations |
| Frontend Framework | Next.js | ^14.0.0 | Full-stack React framework | App Router provides optimal performance for content-heavy educational apps |
| UI Component Library | Chakra UI | ^2.8.0 | Component system and design tokens | Accessibility-first design crucial for educational applications |
| State Management | React Context + Zustand | ^4.4.0 | Global state management | Lightweight solution for preview modal and user session state |
| Backend Language | TypeScript | ^5.2.0 | Server-side logic | Shared types between frontend and backend |
| Backend Framework | Next.js API Routes | ^14.0.0 | Serverless API endpoints | Integrated with frontend, optimal for Vercel deployment |
| API Style | REST | OpenAPI 3.0 | API design standard | Simple, well-documented endpoints for AI generation workflow |
| Database | Supabase (PostgreSQL) | Latest | Data persistence + auth | Managed PostgreSQL with built-in authentication and real-time features |
| Cache | Vercel Edge Cache | Built-in | Static asset caching | Integrated caching for generated card assets and static content |
| File Storage | Supabase Storage | Latest | Generated card storage | Integrated with database, handles image uploads and downloads |
| Authentication | Supabase Auth | Latest | User management | OAuth providers, email auth, JWT tokens |
| Frontend Testing | Vitest + React Testing Library | ^1.0.0 / ^14.0.0 | Component testing | Fast unit tests for UI components and hooks |
| Backend Testing | Vitest | ^1.0.0 | API testing | Same testing framework for consistency |
| E2E Testing | Playwright | ^1.40.0 | End-to-end testing | Critical for card generation and preview workflows |
| Build Tool | Next.js | ^14.0.0 | Build pipeline | Integrated build system with Turbopack |
| Bundler | Turbopack | Built-in | Module bundling | Next.js 14 default bundler for fast development |
| IaC Tool | Vercel CLI | Latest | Infrastructure deployment | Infrastructure as code through vercel.json |
| CI/CD | GitHub Actions + Vercel | Latest | Automated deployment | Integrated deployment pipeline |
| Monitoring | Vercel Analytics + Sentry | Latest | Performance and error tracking | User experience monitoring for educational applications |
| Logging | Vercel Functions Logs + Axiom | Latest | Application logging | Structured logging for AI generation debugging |
| CSS Framework | Chakra UI + Emotion | ^2.8.0 | Styling system | CSS-in-JS with design tokens for consistent educational UI |
