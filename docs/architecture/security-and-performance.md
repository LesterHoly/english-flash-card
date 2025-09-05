# Security and Performance

## Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.openai.com;`
- XSS Prevention: Automatic HTML escaping via React, Content Security Policy headers
- Secure Storage: HTTPOnly cookies for auth tokens, localStorage for non-sensitive preferences only

**Backend Security:**
- Input Validation: Zod schema validation on all API endpoints with sanitization
- Rate Limiting: 60 requests/minute per user, 10 requests/minute for generation endpoints
- CORS Policy: Restricted to production domains with credentials support

**Authentication Security:**
- Token Storage: JWT tokens in HTTPOnly cookies with SameSite=Strict
- Session Management: Supabase Auth with automatic token refresh and secure logout
- Password Policy: Minimum 8 characters, complexity requirements enforced by Supabase

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 250KB initial load, < 500KB total
- Loading Strategy: Route-based code splitting, lazy loading for non-critical components
- Caching Strategy: SWR for API data, service worker for offline card viewing

**Backend Performance:**
- Response Time Target: < 500ms for API calls, < 30s for AI generation
- Database Optimization: Indexed queries, connection pooling, query optimization
- Caching Strategy: Redis-compatible caching via Upstash, CDN for static assets
