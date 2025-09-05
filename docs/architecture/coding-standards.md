# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in src/types/ and import from there - never duplicate type definitions between frontend and backend
- **API Calls:** Never make direct HTTP calls - use the service layer in src/services/api/ for all external requests
- **Environment Variables:** Access only through lib/constants.ts config objects, never process.env directly in components
- **Error Handling:** All API routes must use the standard error handler from lib/errors.ts with consistent response format
- **State Updates:** Never mutate state directly - use proper Zustand actions or React setState patterns
- **Authentication:** All protected routes must use AuthGuard component and validateRequest utility
- **Database Queries:** Always use Row Level Security policies, never bypass with service key in frontend-accessible code
- **Image Handling:** All user-generated images must go through validation and optimization pipeline
- **Rate Limiting:** Implement rate limiting on all AI generation endpoints to prevent cost overruns
- **Content Validation:** All AI-generated content must pass through moderation before storage

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `CardPreview.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/cards/generate` |
| Database Tables | - | snake_case | `flash_cards` |
| Functions | camelCase | camelCase | `generateCard()` |
| Constants | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `MAX_CARDS_PER_DAY` |
| Interfaces | PascalCase with 'I' prefix | PascalCase with 'I' prefix | `IFlashCard` |
| Zustand Stores | camelCase with 'Store' | - | `useCardStore` |
