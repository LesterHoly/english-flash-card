# Card Generation API Route Implementation Guide

This guide provides complete implementation for the card generation API route - the core backend functionality that integrates with OpenAI and manages the async generation workflow.

## Complete API Implementation

### 1. Environment Variables Setup

Create `.env.local`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORGANIZATION=your-org-id

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Rate Limiting
OPENAI_RATE_LIMIT_RPM=60
MAX_CARDS_PER_USER_DAILY=50
```

### 2. OpenAI Service Client

Create `src/lib/openai.ts`:

```typescript
import OpenAI from 'openai';
import { GenerationParams, CardContent, Scene } from '@/types/cards';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    });
  }

  async generateCardContent(options: {
    prompt: string;
    cardType: 'single_word' | 'category';
    params: GenerationParams;
  }): Promise<{
    title: string;
    content: CardContent;
    costs: {
      text_tokens: number;
      image_generations: number;
      total_cost_usd: number;
    };
  }> {
    const { prompt, cardType, params } = options;
    
    let textTokens = 0;
    let imageGenerations = 0;

    try {
      // Step 1: Generate text content and scene descriptions
      const textContent = await this.generateTextContent(prompt, cardType, params);
      textTokens = textContent.usage?.total_tokens || 0;

      // Step 2: Moderate content for educational appropriateness
      await this.moderateContent(textContent.scenes.map(s => s.description).join(' '));

      // Step 3: Generate images for each scene
      const scenes = await this.generateSceneImages(textContent.scenes, params);
      imageGenerations = scenes.length;

      // Step 4: Calculate costs
      const costs = this.calculateCosts(textTokens, imageGenerations);

      return {
        title: textContent.title,
        content: {
          primary_word: textContent.primary_word,
          scenes,
          category_words: textContent.category_words,
          layout: {
            format: "3:4",
            orientation: 'portrait',
            theme: 'colorful'
          }
        },
        costs
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'AI generation failed'
      );
    }
  }

  private async generateTextContent(
    prompt: string, 
    cardType: 'single_word' | 'category',
    params: GenerationParams
  ) {
    const systemPrompt = `You are an expert educational content creator specializing in children's flash cards. 
Create engaging, age-appropriate content for ${params.age_group} students at ${params.difficulty_level} level.
Style should be ${params.style_preference} and child-friendly.

For single_word cards: Create 4 different scenes showing the word in various contexts.
For category cards: Create scenes showing multiple related items in the category.

Respond with JSON only:
{
  "title": "card title",
  "primary_word": "main word",
  "category_words": ["word1", "word2"] (only for category cards),
  "scenes": [
    {
      "id": "scene_1", 
      "description": "detailed scene description for image generation",
      "image_prompt": "optimized prompt for DALL-E"
    }
  ]
}`;

    const userPrompt = cardType === 'single_word' 
      ? `Create a single word flash card for: "${prompt}"`
      : `Create a category flash card for: "${prompt}"`;

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content generated');

    try {
      return {
        ...JSON.parse(content),
        usage: completion.usage
      };
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
  }

  private async moderateContent(content: string): Promise<void> {
    const moderation = await this.client.moderations.create({
      input: content,
    });

    const flagged = moderation.results[0]?.flagged;
    if (flagged) {
      const categories = moderation.results[0]?.categories;
      const flaggedCategories = Object.entries(categories || {})
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);
      
      throw new Error(
        `Content policy violation: ${flaggedCategories.join(', ')}`
      );
    }
  }

  private async generateSceneImages(
    scenes: Array<{ id: string; description: string; image_prompt: string }>,
    params: GenerationParams
  ): Promise<Scene[]> {
    const generatedScenes: Scene[] = [];

    for (const scene of scenes) {
      try {
        const enhancedPrompt = `${scene.image_prompt}, ${params.style_preference} style, child-friendly, colorful, educational, high quality, 3:4 aspect ratio`;

        const response = await this.client.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024", // Will be cropped to 3:4
          quality: "standard",
          style: params.style_preference === 'realistic' ? 'natural' : 'vivid'
        });

        const imageUrl = response.data[0]?.url;
        if (!imageUrl) throw new Error('No image generated');

        generatedScenes.push({
          id: scene.id,
          description: scene.description,
          image_url: imageUrl,
          image_prompt: scene.image_prompt
        });

      } catch (error) {
        console.error(`Failed to generate image for scene ${scene.id}:`, error);
        // Continue with placeholder or retry logic
        generatedScenes.push({
          id: scene.id,
          description: scene.description,
          image_url: '', // Will show loading state in UI
          image_prompt: scene.image_prompt
        });
      }
    }

    return generatedScenes;
  }

  private calculateCosts(textTokens: number, imageGenerations: number): {
    text_tokens: number;
    image_generations: number;
    total_cost_usd: number;
  } {
    // GPT-4 pricing (example rates - update with current pricing)
    const gpt4InputCost = 0.03 / 1000; // $0.03 per 1K input tokens
    const gpt4OutputCost = 0.06 / 1000; // $0.06 per 1K output tokens
    const dalleE3Cost = 0.040; // $0.040 per image for 1024×1024

    const textCost = (textTokens / 2) * gpt4InputCost + (textTokens / 2) * gpt4OutputCost;
    const imageCost = imageGenerations * dalleE3Cost;

    return {
      text_tokens: textTokens,
      image_generations: imageGenerations,
      total_cost_usd: Number((textCost + imageCost).toFixed(4))
    };
  }
}
```

### 3. Card Generation API Route

Create `app/api/cards/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { OpenAIService } from '@/lib/openai';
import { validateRequest } from '@/lib/auth';
import { handleAPIError, QuotaExceededError } from '@/lib/errors';

// Request validation schema
const GenerateCardSchema = z.object({
  input_prompt: z.string().min(1).max(200),
  card_type: z.enum(['single_word', 'category']),
  generation_params: z.object({
    difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    age_group: z.enum(['preschool', 'elementary', 'middle_school']).default('elementary'),
    style_preference: z.enum(['cartoon', 'realistic', 'minimalist']).default('cartoon'),
    language: z.string().default('en')
  }).optional().default({})
});

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Card generation request received');

    // Validate request and authenticate user
    const { data, user } = await validateRequest(request, GenerateCardSchema);
    console.log(`🔐 User authenticated: ${user.id}`);

    // Create Supabase client for this request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
        },
      }
    );

    // Check user's generation quota
    const quotaCheck = await checkUserQuota(supabase, user.id);
    if (!quotaCheck.allowed) {
      console.log(`🚫 Quota exceeded for user ${user.id}`);
      throw new QuotaExceededError(quotaCheck.message);
    }

    // Create generation session
    const { data: session, error: sessionError } = await supabase
      .from('generation_sessions')
      .insert({
        user_id: user.id,
        input_prompt: data.input_prompt,
        generation_type: data.card_type === 'single_word' ? 'single_word_card' : 'category_card',
        status: 'pending'
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('❌ Failed to create session:', sessionError);
      throw new Error('Failed to create generation session');
    }

    console.log(`✅ Session created: ${session.id}`);

    // Start async generation process
    generateCardAsync(session.id, data, user.id)
      .then(() => {
        console.log(`🎉 Generation completed for session ${session.id}`);
      })
      .catch(error => {
        console.error(`❌ Background generation failed for ${session.id}:`, error);
        // Update session with error status
        supabase
          .from('generation_sessions')
          .update({ 
            status: 'failed', 
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', session.id)
          .then(() => console.log(`💾 Error status saved for session ${session.id}`));
      });

    return NextResponse.json(session);

  } catch (error) {
    console.error('🚨 API Error:', error);
    return handleAPIError(error);
  }
}

// Background generation function
async function generateCardAsync(
  sessionId: string,
  data: z.infer<typeof GenerateCardSchema>,
  userId: string
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const openai = new OpenAIService();

  try {
    console.log(`🔄 Starting generation for session ${sessionId}`);

    // Update session to processing
    await supabase
      .from('generation_sessions')
      .update({ status: 'processing' })
      .eq('id', sessionId);

    // Generate card content with OpenAI
    console.log(`🤖 Calling OpenAI for session ${sessionId}`);
    const cardContent = await openai.generateCardContent({
      prompt: data.input_prompt,
      cardType: data.card_type,
      params: data.generation_params
    });

    console.log(`✨ OpenAI generation complete for session ${sessionId}`);

    // Create card record
    const { data: card, error: cardError } = await supabase
      .from('flash_cards')
      .insert({
        user_id: userId,
        session_id: sessionId,
        title: cardContent.title,
        card_type: data.card_type,
        content: cardContent.content,
        generation_params: data.generation_params,
        status: 'preview'
      })
      .select()
      .single();

    if (cardError) {
      console.error('❌ Failed to save card:', cardError);
      throw new Error(`Failed to save card: ${cardError.message}`);
    }

    // Create card scenes in normalized table
    if (cardContent.content.scenes.length > 0) {
      const sceneData = cardContent.content.scenes.map((scene, index) => ({
        card_id: card.id,
        scene_order: index + 1,
        description: scene.description,
        image_url: scene.image_url,
        image_prompt: scene.image_prompt
      }));

      const { error: scenesError } = await supabase
        .from('card_scenes')
        .insert(sceneData);

      if (scenesError) {
        console.error('⚠️ Failed to save scenes:', scenesError);
        // Continue - scenes can be regenerated
      }
    }

    // Update session as completed
    const { error: updateError } = await supabase
      .from('generation_sessions')
      .update({ 
        status: 'completed',
        ai_costs: cardContent.costs,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('⚠️ Failed to update session:', updateError);
    }

    // Update user usage tracking
    await updateUserUsage(supabase, userId, cardContent.costs);

    console.log(`🏁 Generation workflow complete for session ${sessionId}`);

  } catch (error) {
    console.error(`💥 Generation failed for session ${sessionId}:`, error);
    
    // Update session with error
    await supabase
      .from('generation_sessions')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    throw error;
  }
}

async function checkUserQuota(supabase: any, userId: string): Promise<{
  allowed: boolean;
  message?: string;
}> {
  try {
    // Get user's subscription tier
    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    const tier = user?.subscription_tier || 'free';
    
    // Define quota limits
    const quotaLimits = {
      free: 5,
      educator: 50,
      premium: 200
    };

    const dailyLimit = quotaLimits[tier as keyof typeof quotaLimits];

    // Check today's usage
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('generation_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const todayCount = count || 0;

    if (todayCount >= dailyLimit) {
      return {
        allowed: false,
        message: `Daily limit of ${dailyLimit} cards reached. Upgrade to generate more cards.`
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Quota check failed:', error);
    return { allowed: true }; // Fail open to avoid blocking users
  }
}

async function updateUserUsage(supabase: any, userId: string, costs: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const periodStart = today;
    const periodEnd = today;

    // Upsert usage record for today
    const { error } = await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        cards_generated: 1,
        total_ai_cost: costs.total_cost_usd
      }, {
        onConflict: 'user_id,period_start',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Failed to update usage:', error);
    }

  } catch (error) {
    console.error('Usage tracking failed:', error);
    // Don't throw - usage tracking shouldn't block generation
  }
}
```

### 4. Generation Status Check Route

Create `app/api/cards/generation/[sessionId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { validateRequest } from '@/lib/auth';
import { handleAPIError } from '@/lib/errors';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { user } = await validateRequest(request, z.any());
    const { sessionId } = params;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
        },
      }
    );

    // Get session with associated cards
    const { data: session, error: sessionError } = await supabase
      .from('generation_sessions')
      .select(`
        *,
        flash_cards (
          *,
          card_scenes (
            id,
            scene_order,
            description,
            image_url
          )
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user owns the session
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    // Transform the response to match expected format
    const response = {
      ...session,
      cards: session.flash_cards || []
    };

    return NextResponse.json(response);

  } catch (error) {
    return handleAPIError(error);
  }
}
```

### 5. Authentication and Error Handling

Create `src/lib/auth.ts`:

```typescript
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T; user: any }> {
  // Parse and validate request body
  let data: T;
  try {
    const body = await request.json();
    data = schema.parse(body);
  } catch (error) {
    throw new ValidationError('Invalid request data');
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
      },
    }
  );

  // Get user from session
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AuthenticationError('Authentication required');
  }

  return { data, user };
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

Create `src/lib/errors.ts`:

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticationError, ValidationError } from './auth';

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class QuotaExceededError extends APIError {
  constructor(message: string = 'Generation quota exceeded') {
    super('QUOTA_EXCEEDED', message, 429);
  }
}

export class ContentPolicyError extends APIError {
  constructor(message: string = 'Content violates policy') {
    super('CONTENT_POLICY_VIOLATION', message, 400);
  }
}

export function handleAPIError(error: unknown): NextResponse {
  const requestId = uuidv4();
  const timestamp = new Date().toISOString();

  // Log error for debugging
  console.error(`[${requestId}] API Error:`, error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp,
          requestId,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: error.message,
          timestamp,
          requestId,
        },
      },
      { status: 401 }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          timestamp,
          requestId,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.flatten(),
          timestamp,
          requestId,
        },
      },
      { status: 400 }
    );
  }

  // Generic error response
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp,
        requestId,
      },
    },
    { status: 500 }
  );
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install openai zod uuid
npm install -D @types/uuid
```

### 2. File Structure

```
app/
└── api/
    └── cards/
        ├── generate/
        │   └── route.ts
        └── generation/
            └── [sessionId]/
                └── route.ts
src/
└── lib/
    ├── openai.ts
    ├── auth.ts
    └── errors.ts
```

### 3. Environment Setup

```bash
# Set in Vercel dashboard for production
OPENAI_API_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Testing the API

### 1. Manual Testing

```bash
# Test generation
curl -X POST http://localhost:3000/api/cards/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-supabase-auth-token" \
  -d '{
    "input_prompt": "elephant",
    "card_type": "single_word",
    "generation_params": {
      "difficulty_level": "beginner",
      "age_group": "elementary"
    }
  }'

# Check status
curl http://localhost:3000/api/cards/generation/SESSION_ID \
  -H "Cookie: your-supabase-auth-token"
```

### 2. Unit Tests

```typescript
// __tests__/api/generate.test.ts
import { POST } from '@/app/api/cards/generate/route';
import { NextRequest } from 'next/server';

describe('/api/cards/generate', () => {
  it('creates generation session', async () => {
    const request = new NextRequest('http://localhost:3000/api/cards/generate', {
      method: 'POST',
      body: JSON.stringify({
        input_prompt: 'elephant',
        card_type: 'single_word'
      }),
      headers: { 'Cookie': 'mock-auth-token' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data.status).toBe('pending');
  });
});
```

## Common Issues & Troubleshooting

### 1. OpenAI Rate Limits
```typescript
// Implement exponential backoff
async function retryWithBackoff(fn: () => Promise<any>, maxRetries: number = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

### 2. Large Image Processing
```typescript
// Handle image optimization
import sharp from 'sharp';

async function optimizeImage(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  
  const optimized = await sharp(Buffer.from(buffer))
    .resize(400, 533) // 3:4 aspect ratio
    .jpeg({ quality: 80 })
    .toBuffer();
    
  // Upload to Supabase Storage
  // Return optimized URL
}
```

### 3. Timeout Handling
```typescript
// Set timeouts for long operations
const timeout = (ms: number) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), ms)
);

const result = await Promise.race([
  openai.generateCardContent(options),
  timeout(30000) // 30 second timeout
]);
```

This implementation provides a production-ready, scalable API route that handles the full card generation workflow with proper error handling, quota management, and OpenAI integration.