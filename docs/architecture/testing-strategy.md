# Testing Strategy

## Testing Pyramid

```
      E2E Tests (5%)
     /              \
    Integration Tests (15%)
   /                    \
  Frontend Unit (40%)  Backend Unit (40%)
```

## Test Organization

### Frontend Tests
```
tests/components/
├── cards/
│   ├── CardPreview.test.tsx
│   ├── CardGenerator.test.tsx
│   └── CardLibrary.test.tsx
├── auth/
│   ├── AuthGuard.test.tsx
│   └── LoginForm.test.tsx
└── hooks/
    ├── useAuth.test.ts
    ├── useCardGeneration.test.ts
    └── usePreview.test.ts
```

### Backend Tests
```
tests/api/
├── cards/
│   ├── generate.test.ts
│   ├── approve.test.ts
│   └── library.test.ts
├── auth/
│   └── session.test.ts
└── lib/
    ├── openai.test.ts
    ├── validation.test.ts
    └── repositories.test.ts
```

### E2E Tests
```
tests/e2e/
├── auth.spec.ts           # Login/logout flows
├── generation.spec.ts     # Card generation workflow
├── preview.spec.ts        # Preview modal interactions
└── library.spec.ts        # Card library management
```

## Test Examples

### Frontend Component Test
```typescript
// tests/components/cards/CardPreview.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { CardPreview } from '@/components/cards/CardPreview';
import { mockFlashCard } from '../fixtures/cards';

const renderCardPreview = (props = {}) => {
  const defaultProps = {
    card: mockFlashCard,
    isOpen: true,
    onClose: jest.fn(),
    onApprove: jest.fn(),
    onRegenerate: jest.fn(),
    ...props
  };

  return render(
    <ChakraProvider>
      <CardPreview {...defaultProps} />
    </ChakraProvider>
  );
};

describe('CardPreview', () => {
  it('displays card content in 3:4 aspect ratio', () => {
    renderCardPreview();
    
    expect(screen.getByText('Preview: Test Card')).toBeInTheDocument();
    expect(screen.getByText('elephant')).toBeInTheDocument();
    
    // Check that all 4 scenes are displayed
    const scenes = screen.getAllByRole('img');
    expect(scenes).toHaveLength(4);
  });

  it('calls onApprove when approve button is clicked', async () => {
    const onApprove = jest.fn();
    renderCardPreview({ onApprove });
    
    fireEvent.click(screen.getByText('Approve & Download'));
    
    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith(mockFlashCard.id);
    });
  });

  it('calls onRegenerate when regenerate button is clicked', async () => {
    const onRegenerate = jest.fn();
    renderCardPreview({ onRegenerate });
    
    fireEvent.click(screen.getByText('Regenerate'));
    
    await waitFor(() => {
      expect(onRegenerate).toHaveBeenCalledWith(mockFlashCard.id);
    });
  });
});
```

### Backend API Test
```typescript
// tests/api/cards/generate.test.ts
import { POST } from '@/app/api/cards/generate/route';
import { NextRequest } from 'next/server';
import { createMockSupabaseClient } from '../../mocks/supabase';
import { createMockOpenAIService } from '../../mocks/openai';

// Mock external dependencies
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => createMockSupabaseClient()
}));

jest.mock('@/lib/openai', () => ({
  OpenAIService: jest.fn(() => createMockOpenAIService())
}));

describe('/api/cards/generate', () => {
  it('creates generation session and returns session ID', async () => {
    const requestBody = {
      input_prompt: 'animals',
      card_type: 'single_word',
      generation_params: {
        difficulty_level: 'beginner',
        age_group: 'elementary'
      }
    };

    const request = new NextRequest('http://localhost:3000/api/cards/generate', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sb-access-token=mock-jwt-token'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data.input_prompt).toBe('animals');
    expect(data.status).toBe('pending');
  });

  it('returns 401 for unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/cards/generate', {
      method: 'POST',
      body: JSON.stringify({ input_prompt: 'test' })
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('validates request body and returns 400 for invalid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/cards/generate', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
      headers: {
        'Cookie': 'sb-access-token=mock-jwt-token'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

### E2E Test
```typescript
// tests/e2e/generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Card Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock OpenAI API responses
    await page.route('https://api.openai.com/**', async route => {
      if (route.request().url().includes('chat/completions')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            choices: [{ message: { content: 'Mock card content' } }]
          })
        });
      }
    });

    // Login
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    
    await expect(page).toHaveURL('/generate');
  });

  test('generates card and shows preview modal', async ({ page }) => {
    // Fill generation form
    await page.fill('[data-testid=prompt-input]', 'elephant');
    await page.selectOption('[data-testid=card-type]', 'single_word');
    await page.click('[data-testid=generate-button]');

    // Wait for generation to complete
    await expect(page.locator('[data-testid=loading-spinner]')).toBeVisible();
    await expect(page.locator('[data-testid=loading-spinner]')).not.toBeVisible({ timeout: 30000 });

    // Verify preview modal appears
    await expect(page.locator('[data-testid=preview-modal]')).toBeVisible();
    await expect(page.locator('text=Preview: elephant')).toBeVisible();

    // Check 3:4 aspect ratio container is present
    const aspectRatio = page.locator('[data-testid=card-aspect-ratio]');
    await expect(aspectRatio).toBeVisible();

    // Verify action buttons
    await expect(page.locator('text=Approve & Download')).toBeVisible();
    await expect(page.locator('text=Regenerate')).toBeVisible();
  });

  test('approves card and downloads', async ({ page }) => {
    // ... setup generation as above ...
    
    // Click approve
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Approve & Download');
    
    // Verify download starts
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('elephant');
    expect(download.suggestedFilename()).toContain('.pdf');

    // Verify modal closes
    await expect(page.locator('[data-testid=preview-modal]')).not.toBeVisible();
  });

  test('regenerates card with new content', async ({ page }) => {
    // ... setup generation as above ...
    
    // Click regenerate
    await page.click('text=Regenerate');

    // Verify modal closes and new generation starts
    await expect(page.locator('[data-testid=preview-modal]')).not.toBeVisible();
    await expect(page.locator('[data-testid=loading-spinner]')).toBeVisible();

    // Wait for new card to generate
    await expect(page.locator('[data-testid=loading-spinner]')).not.toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid=preview-modal]')).toBeVisible();
  });
});
```
