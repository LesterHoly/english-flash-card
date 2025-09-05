# Frontend Architecture

## Component Architecture

### Component Organization
```
src/
├── components/
│   ├── ui/                     # Chakra UI base components
│   │   ├── Button/
│   │   ├── Modal/
│   │   └── Card/
│   ├── cards/                  # Card-specific components
│   │   ├── CardGenerator/
│   │   ├── CardPreview/
│   │   ├── CardLibrary/
│   │   └── CardDownload/
│   ├── auth/                   # Authentication components
│   │   ├── LoginForm/
│   │   ├── SignupForm/
│   │   └── AuthGuard/
│   ├── layout/                 # Layout components
│   │   ├── Header/
│   │   ├── Navigation/
│   │   └── Footer/
│   └── forms/                  # Reusable form components
│       ├── GenerationForm/
│       └── PreferencesForm/
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts
│   ├── useCardGeneration.ts
│   ├── usePreview.ts
│   └── usePreferences.ts
├── stores/                     # Zustand stores
│   ├── authStore.ts
│   ├── cardStore.ts
│   └── uiStore.ts
├── services/                   # API service layer
│   ├── api/
│   │   ├── cards.ts
│   │   ├── auth.ts
│   │   └── preferences.ts
│   └── utils/
└── types/                      # TypeScript type definitions
    ├── api.ts
    ├── cards.ts
    └── user.ts
```

### Component Template
```typescript
// components/cards/CardPreview/CardPreview.tsx
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  AspectRatio,
  VStack,
  HStack,
  Text,
  Image,
  Grid,
  GridItem,
  useDisclosure
} from '@chakra-ui/react';
import { FlashCard } from '@/types/cards';
import { useCardGeneration } from '@/hooks/useCardGeneration';

interface CardPreviewProps {
  card: FlashCard;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (cardId: string) => Promise<void>;
  onRegenerate: (cardId: string) => Promise<void>;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  isOpen,
  onClose,
  onApprove,
  onRegenerate
}) => {
  const { isProcessing } = useCardGeneration();

  const handleApprove = async () => {
    await onApprove(card.id);
    onClose();
  };

  const handleRegenerate = async () => {
    await onRegenerate(card.id);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="600px">
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <Text fontSize="xl" fontWeight="bold" textAlign="center">
              Preview: {card.title}
            </Text>
            
            {/* 3:4 Aspect Ratio Card Display */}
            <AspectRatio ratio={3/4} bg="gray.50" borderRadius="lg">
              <Grid templateColumns="1fr 1fr" templateRows="1fr 1fr" gap={2} p={4}>
                {card.content.scenes.map((scene, index) => (
                  <GridItem key={scene.id}>
                    <VStack spacing={2} h="full">
                      <Image
                        src={scene.image_url}
                        alt={scene.description}
                        borderRadius="md"
                        objectFit="cover"
                        w="full"
                        flex={1}
                      />
                      <Text fontSize="sm" textAlign="center" noOfLines={2}>
                        {scene.description}
                      </Text>
                    </VStack>
                  </GridItem>
                ))}
              </Grid>
            </AspectRatio>
            
            <Text fontSize="lg" fontWeight="semibold" textAlign="center">
              {card.content.primary_word}
            </Text>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3} w="full" justify="center">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              variant="outline"
              onClick={handleRegenerate}
              isLoading={isProcessing}
              loadingText="Regenerating..."
            >
              Regenerate
            </Button>
            <Button
              colorScheme="green"
              onClick={handleApprove}
              isLoading={isProcessing}
              loadingText="Processing..."
            >
              Approve & Download
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CardPreview;
```

## State Management Architecture

### State Structure
```typescript
// stores/cardStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { FlashCard, GenerationSession } from '@/types/cards';

interface CardState {
  // Current generation
  currentSession: GenerationSession | null;
  generatedCard: FlashCard | null;
  isGenerating: boolean;
  
  // Preview modal
  previewCard: FlashCard | null;
  isPreviewOpen: boolean;
  
  // Card library
  userCards: FlashCard[];
  totalCards: number;
  currentPage: number;
  
  // Actions
  startGeneration: (prompt: string, params: GenerationParams) => Promise<void>;
  checkGenerationStatus: (sessionId: string) => Promise<void>;
  openPreview: (card: FlashCard) => void;
  closePreview: () => void;
  approveCard: (cardId: string) => Promise<void>;
  regenerateCard: (cardId: string) => Promise<void>;
  loadUserCards: (page?: number) => Promise<void>;
  
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

export const useCardStore = create<CardState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSession: null,
        generatedCard: null,
        isGenerating: false,
        previewCard: null,
        isPreviewOpen: false,
        userCards: [],
        totalCards: 0,
        currentPage: 1,
        error: null,

        // Actions
        startGeneration: async (prompt: string, params: GenerationParams) => {
          set({ isGenerating: true, error: null });
          try {
            const session = await cardService.generateCard(prompt, params);
            set({ currentSession: session });
            
            // Poll for completion
            get().checkGenerationStatus(session.id);
          } catch (error) {
            set({ error: error.message, isGenerating: false });
          }
        },

        checkGenerationStatus: async (sessionId: string) => {
          try {
            const session = await cardService.getGenerationStatus(sessionId);
            set({ currentSession: session });
            
            if (session.status === 'completed' && session.cards?.[0]) {
              const card = session.cards[0];
              set({ 
                generatedCard: card,
                isGenerating: false,
                previewCard: card,
                isPreviewOpen: !userPreferences.skip_preview 
              });
            } else if (session.status === 'failed') {
              set({ error: session.error_message, isGenerating: false });
            } else if (session.status === 'processing') {
              // Continue polling
              setTimeout(() => get().checkGenerationStatus(sessionId), 2000);
            }
          } catch (error) {
            set({ error: error.message, isGenerating: false });
          }
        },

        openPreview: (card: FlashCard) => {
          set({ previewCard: card, isPreviewOpen: true });
        },

        closePreview: () => {
          set({ previewCard: null, isPreviewOpen: false });
        },

        approveCard: async (cardId: string) => {
          try {
            await cardService.approveCard(cardId);
            set({ isPreviewOpen: false });
            // Refresh user cards
            get().loadUserCards();
          } catch (error) {
            set({ error: error.message });
          }
        },

        regenerateCard: async (cardId: string) => {
          const card = get().previewCard;
          if (card?.generation_params) {
            set({ isPreviewOpen: false });
            get().startGeneration(card.title, card.generation_params);
          }
        },

        loadUserCards: async (page = 1) => {
          try {
            const response = await cardService.getUserCards({ page, limit: 20 });
            set({ 
              userCards: response.cards,
              totalCards: response.pagination.total,
              currentPage: page 
            });
          } catch (error) {
            set({ error: error.message });
          }
        },

        setError: (error: string | null) => {
          set({ error });
        }
      }),
      {
        name: 'card-store',
        // Only persist user cards and current page
        partialize: (state) => ({
          userCards: state.userCards,
          currentPage: state.currentPage,
          totalCards: state.totalCards
        })
      }
    )
  )
);
```

### State Management Patterns
- **Single Source of Truth:** Zustand stores manage all application state centrally
- **Derived State:** Component-level derived state using useMemo for computed values
- **Optimistic Updates:** UI updates immediately, with rollback on API failure
- **Persistence:** User cards and preferences cached locally for offline viewing
- **Error Boundaries:** React Error Boundaries catch and handle component errors

## Routing Architecture

### Route Organization
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── generate/
│   │   └── page.tsx
│   ├── library/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── layout.tsx
├── layout.tsx
├── page.tsx
└── not-found.tsx
```

### Protected Route Pattern
```typescript
// components/auth/AuthGuard.tsx
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner, Center, VStack, Text } from '@chakra-ui/react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading your account...</Text>
        </VStack>
      </Center>
    );
  }

  if (!user) {
    router.push('/login');
    return fallback || null;
  }

  return <>{children}</>;
};

// app/(dashboard)/layout.tsx
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
```

## Frontend Services Layer

### API Client Setup
```typescript
// services/api/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// API client with auth and error handling
class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`
        }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient();
```

### Service Example
```typescript
// services/api/cards.ts
import { apiClient } from './client';
import { FlashCard, GenerationSession, GenerationParams } from '@/types/cards';

export const cardService = {
  generateCard: async (
    prompt: string, 
    params: GenerationParams
  ): Promise<GenerationSession> => {
    return apiClient.post('/cards/generate', { 
      input_prompt: prompt, 
      card_type: params.card_type,
      generation_params: params 
    });
  },

  getGenerationStatus: async (sessionId: string): Promise<GenerationSession> => {
    return apiClient.get(`/cards/generation/${sessionId}`);
  },

  approveCard: async (cardId: string): Promise<FlashCard> => {
    return apiClient.post(`/cards/${cardId}/approve`);
  },

  getUserCards: async (pagination: { page: number; limit: number }) => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });
    return apiClient.get(`/cards?${params}`);
  },

  downloadCard: async (cardId: string, format: 'pdf' | 'png' = 'pdf') => {
    const response = await fetch(`/api/cards/${cardId}/download?format=${format}`, {
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });
    return response.blob();
  }
};
```
