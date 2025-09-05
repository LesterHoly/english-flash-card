# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics + Sentry for React error tracking
- **Backend Monitoring:** Vercel Functions Insights + Axiom for structured logging
- **Error Tracking:** Sentry with custom error boundaries and API error tracking
- **Performance Monitoring:** Core Web Vitals, API response times, OpenAI API latency

## Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and crash rates
- API response times from client perspective
- User interaction success rates (generation, preview, download)
- Route change performance

**Backend Metrics:**
- Request rate and error rate per endpoint
- Response time percentiles (p50, p95, p99)
- Database query performance
- OpenAI API call success/failure rates
- Function cold start frequency and duration

**Business Metrics:**
- Card generation success rate
- Preview modal engagement (approve vs regenerate)
- User quota utilization
- AI cost per successful generation
- Daily/monthly active users
