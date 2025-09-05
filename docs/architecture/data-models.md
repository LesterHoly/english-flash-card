# Data Models

## User

**Purpose:** Manages user authentication, preferences, and usage tracking for the educational platform

**Key Attributes:**
- id: string (UUID) - Primary identifier
- email: string - Authentication and communication
- name: string - Display name for personalization  
- preferences: UserPreferences - Settings including skip_preview toggle
- subscription_tier: SubscriptionTier - Usage limits and features
- created_at: timestamp - Account creation tracking
- updated_at: timestamp - Last activity tracking

### TypeScript Interface
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  skip_preview: boolean;
  default_card_type: CardType;
  theme: 'light' | 'dark';
}

type SubscriptionTier = 'free' | 'educator' | 'premium';
```

### Relationships
- Has many FlashCards
- Has many GenerationSessions

## FlashCard

**Purpose:** Represents generated educational content with both single word and category variations

**Key Attributes:**
- id: string (UUID) - Primary identifier
- user_id: string - Owner reference
- title: string - Card title/primary word
- card_type: CardType - Single word or category card
- content: CardContent - Generated text and image data
- generation_params: GenerationParams - AI generation settings used
- status: CardStatus - Generation and review state
- created_at: timestamp - Generation time
- updated_at: timestamp - Last modification

### TypeScript Interface
```typescript
interface FlashCard {
  id: string;
  user_id: string;
  title: string;
  card_type: CardType;
  content: CardContent;
  generation_params: GenerationParams;
  status: CardStatus;
  created_at: string;
  updated_at: string;
}

type CardType = 'single_word' | 'category';

interface CardContent {
  primary_word: string;
  scenes: Scene[];
  category_words?: string[]; // For category cards
  layout: CardLayout;
}

interface Scene {
  id: string;
  description: string;
  image_url: string;
  image_prompt: string;
}

type CardStatus = 'generating' | 'preview' | 'approved' | 'downloaded';
```

### Relationships
- Belongs to User
- Belongs to GenerationSession

## GenerationSession

**Purpose:** Tracks AI generation requests, costs, and batch operations for analytics and billing

**Key Attributes:**
- id: string (UUID) - Primary identifier
- user_id: string - User reference
- input_prompt: string - Original user input
- generation_type: GenerationType - Type of content generated
- ai_costs: AICosts - OpenAI API usage tracking
- status: SessionStatus - Processing state
- error_message: string - Failure details if applicable
- created_at: timestamp - Session start time
- completed_at: timestamp - Session completion time

### TypeScript Interface
```typescript
interface GenerationSession {
  id: string;
  user_id: string;
  input_prompt: string;
  generation_type: GenerationType;
  ai_costs: AICosts;
  status: SessionStatus;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

type GenerationType = 'single_word_card' | 'category_card' | 'regeneration';

interface AICosts {
  text_tokens: number;
  image_generations: number;
  total_cost_usd: number;
}

type SessionStatus = 'pending' | 'processing' | 'completed' | 'failed';
```

### Relationships
- Belongs to User
- Has many FlashCards (for batch generations)
