# External APIs

## OpenAI API

- **Purpose:** AI-powered text and image generation for educational flash cards
- **Documentation:** https://platform.openai.com/docs/api-reference
- **Base URL(s):** https://api.openai.com/v1
- **Authentication:** Bearer token (API key)
- **Rate Limits:** 
  - GPT-4: 10,000 TPM (tokens per minute)
  - GPT-4O: 7 images per minute
  - Organization-level quotas apply

**Key Endpoints Used:**
- `POST /chat/completions` - Generate card text content and scene descriptions
- `POST /images/generations` - Generate educational scene images with DALL-E
- `POST /moderations` - Content safety validation for educational appropriateness

**Integration Notes:** Implement exponential backoff for rate limiting, cache generation parameters to avoid duplicate calls, use streaming for text generation to improve perceived performance

## Supabase API

- **Purpose:** Authentication, database operations, and file storage for user data and generated content
- **Documentation:** https://supabase.com/docs/reference/javascript
- **Base URL(s):** https://your-project.supabase.co
- **Authentication:** JWT tokens, API keys
- **Rate Limits:** 
  - Database: 500 requests per second
  - Auth: 30 requests per hour per IP for signup
  - Storage: 100MB per file, 2GB total per project

**Key Endpoints Used:**
- `POST /auth/v1/token` - User authentication and session management
- `GET/POST/PATCH /rest/v1/flash_cards` - Card CRUD operations
- `POST /storage/v1/object/{bucket}` - Image file upload and management

**Integration Notes:** Use row-level security (RLS) for data isolation, implement real-time subscriptions for generation status updates, optimize storage with image compression pipeline

## Vercel Analytics API

- **Purpose:** Performance monitoring and user behavior analytics for educational application optimization
- **Documentation:** https://vercel.com/docs/analytics
- **Base URL(s):** Built-in Vercel deployment integration
- **Authentication:** Automatic with Vercel deployment
- **Rate Limits:** No explicit limits (usage-based billing)

**Key Endpoints Used:**
- Built-in Web Vitals tracking for card preview performance
- Custom event tracking for generation workflow completion rates
- Error rate monitoring for AI service failures

**Integration Notes:** Track card generation success rates, preview engagement metrics, and download conversion rates for product optimization
