# Unified Project Structure

```plaintext
english-flash-card/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── app/                        # Next.js App Router (Frontend application)
│   ├── (auth)/                 # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/            # Protected routes
│   │   ├── generate/
│   │   │   └── page.tsx
│   │   ├── library/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/                    # Backend API routes
│   │   ├── auth/
│   │   │   ├── session/
│   │   │   │   └── route.ts
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   ├── cards/
│   │   │   ├── generate/
│   │   │   │   └── route.ts
│   │   │   ├── generation/
│   │   │   │   └── [sessionId]/
│   │   │   │       └── route.ts
│   │   │   ├── [cardId]/
│   │   │   │   ├── approve/
│   │   │   │   │   └── route.ts
│   │   │   │   └── download/
│   │   │   │       └── route.ts
│   │   │   └── route.ts
│   │   ├── user/
│   │   │   └── preferences/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── openai/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── src/                        # Application source code
│   ├── components/             # UI components
│   │   ├── ui/                 # Base Chakra UI components
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   └── index.ts
│   │   ├── cards/              # Card-specific components
│   │   │   ├── CardGenerator/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── GenerationForm.tsx
│   │   │   │   └── LoadingState.tsx
│   │   │   ├── CardPreview/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── PreviewModal.tsx
│   │   │   │   └── CardDisplay.tsx
│   │   │   ├── CardLibrary/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── CardGrid.tsx
│   │   │   │   └── CardItem.tsx
│   │   │   └── index.ts
│   │   ├── auth/               # Authentication components
│   │   │   ├── AuthGuard.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── index.ts
│   │   ├── layout/             # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── index.ts
│   │   └── forms/              # Reusable form components
│   │       ├── GenerationForm.tsx
│   │       ├── PreferencesForm.tsx
│   │       └── index.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCardGeneration.ts
│   │   ├── usePreview.ts
│   │   ├── usePreferences.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── stores/                 # Zustand state management
│   │   ├── authStore.ts
│   │   ├── cardStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   ├── lib/                    # Backend utilities and services
│   │   ├── auth.ts             # Authentication utilities
│   │   ├── openai.ts           # OpenAI service client
│   │   ├── supabase.ts         # Database client
│   │   ├── errors.ts           # Error handling utilities
│   │   ├── validation.ts       # Request validation schemas
│   │   ├── constants.ts        # Application constants
│   │   └── utils.ts            # General utilities
│   ├── services/               # Frontend API service layer
│   │   ├── api/
│   │   │   ├── client.ts       # API client setup
│   │   │   ├── cards.ts        # Card API services
│   │   │   ├── auth.ts         # Auth API services
│   │   │   ├── preferences.ts  # User preferences API
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── formatting.ts   # Data formatting utilities
│   │       ├── validation.ts   # Client-side validation
│   │       └── storage.ts      # Local storage utilities
│   ├── types/                  # TypeScript type definitions
│   │   ├── api.ts              # API response types
│   │   ├── cards.ts            # Card-related types
│   │   ├── user.ts             # User and auth types
│   │   ├── database.ts         # Supabase database types
│   │   └── index.ts
│   ├── styles/                 # Global styles and themes
│   │   ├── globals.css
│   │   ├── theme.ts            # Chakra UI theme configuration
│   │   └── components.ts       # Component-specific styles
│   └── utils/                  # Frontend utilities
│       ├── formatting.ts       # Text and date formatting
│       ├── validation.ts       # Form validation helpers
│       ├── constants.ts        # Frontend constants
│       └── helpers.ts          # General helper functions
├── public/                     # Static assets
│   ├── icons/
│   ├── images/
│   │   ├── placeholders/
│   │   └── backgrounds/
│   ├── favicon.ico
│   └── robots.txt
├── tests/                      # Test files
│   ├── components/             # Component tests
│   ├── api/                    # API route tests
│   ├── hooks/                  # Custom hook tests
│   ├── utils/                  # Utility function tests
│   ├── e2e/                    # End-to-end tests
│   │   ├── auth.spec.ts
│   │   ├── generation.spec.ts
│   │   └── preview.spec.ts
│   ├── fixtures/               # Test data fixtures
│   ├── mocks/                  # API and service mocks
│   └── setup.ts                # Test environment setup
├── docs/                       # Documentation
│   ├── api/                    # API documentation
│   ├── components/             # Component documentation
│   ├── deployment/             # Deployment guides
│   ├── prd.md                  # Product Requirements Document
│   ├── architecture.md         # This architecture document
│   └── README.md
├── .env.local.example          # Environment template
├── .env.local                  # Local environment variables
├── .gitignore
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest configuration
├── playwright.config.ts        # Playwright E2E configuration
├── package.json                # Dependencies and scripts
├── vercel.json                 # Vercel deployment configuration
└── README.md                   # Project documentation
```
