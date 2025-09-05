# CardPreviewModal Implementation Guide

This guide provides complete implementation for the CardPreviewModal component - the core feature from the PRD that allows users to preview generated flash cards before download.

## Complete Component Implementation

### 1. TypeScript Interfaces

Create `src/types/cards.ts`:

```typescript
export interface FlashCard {
  id: string;
  user_id: string;
  title: string;
  card_type: 'single_word' | 'category';
  content: CardContent;
  generation_params: GenerationParams;
  status: 'generating' | 'preview' | 'approved' | 'downloaded';
  created_at: string;
  updated_at: string;
}

export interface CardContent {
  primary_word: string;
  scenes: Scene[];
  category_words?: string[];
  layout: CardLayout;
}

export interface Scene {
  id: string;
  description: string;
  image_url: string;
  image_prompt: string;
}

export interface CardLayout {
  format: "3:4";
  orientation: 'portrait' | 'landscape';
  theme: 'bright' | 'colorful' | 'minimal';
}

export interface GenerationParams {
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  age_group: 'preschool' | 'elementary' | 'middle_school';
  style_preference: 'cartoon' | 'realistic' | 'minimalist';
  language: string;
}
```

### 2. Zustand Store Integration

Create `src/stores/cardStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { FlashCard, GenerationSession } from '@/types/cards';
import { cardService } from '@/services/api/cards';

interface CardState {
  // Preview modal state
  previewCard: FlashCard | null;
  isPreviewOpen: boolean;
  isProcessing: boolean;
  
  // Actions
  openPreview: (card: FlashCard) => void;
  closePreview: () => void;
  approveCard: (cardId: string) => Promise<void>;
  regenerateCard: (cardId: string) => Promise<void>;
  
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

export const useCardStore = create<CardState>()(
  devtools(
    (set, get) => ({
      // Initial state
      previewCard: null,
      isPreviewOpen: false,
      isProcessing: false,
      error: null,

      // Actions
      openPreview: (card: FlashCard) => {
        set({ previewCard: card, isPreviewOpen: true });
      },

      closePreview: () => {
        set({ previewCard: null, isPreviewOpen: false });
      },

      approveCard: async (cardId: string) => {
        set({ isProcessing: true, error: null });
        try {
          await cardService.approveCard(cardId);
          set({ isPreviewOpen: false, isProcessing: false });
          
          // Trigger download
          const downloadUrl = await cardService.getDownloadUrl(cardId, 'pdf');
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${get().previewCard?.title || 'flashcard'}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to approve card',
            isProcessing: false 
          });
        }
      },

      regenerateCard: async (cardId: string) => {
        const card = get().previewCard;
        if (!card) return;

        set({ isProcessing: true, error: null });
        try {
          // Close current preview
          set({ isPreviewOpen: false });
          
          // Start regeneration with same parameters
          await cardService.regenerateCard(cardId, card.generation_params);
          set({ isProcessing: false });
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to regenerate card',
            isProcessing: false 
          });
        }
      },

      setError: (error: string | null) => {
        set({ error });
      }
    })
  )
);
```

### 3. Main CardPreview Component

Create `src/components/cards/CardPreview/CardPreview.tsx`:

```typescript
import React, { useEffect } from 'react';
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
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FlashCard } from '@/types/cards';
import { useCardStore } from '@/stores/cardStore';

interface CardPreviewProps {
  card: FlashCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  isOpen,
  onClose
}) => {
  const { isProcessing, error, approveCard, regenerateCard, setError } = useCardStore();
  const toast = useToast();

  // Handle error display
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setError(null);
    }
  }, [error, toast, setError]);

  if (!card) return null;

  const handleApprove = () => {
    approveCard(card.id);
  };

  const handleRegenerate = () => {
    regenerateCard(card.id);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl"
      motionPreset="slideInBottom"
      closeOnOverlayClick={!isProcessing}
      closeOnEsc={!isProcessing}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="600px" mx={4}>
        <ModalBody p={6}>
          <VStack spacing={6} align="stretch">
            <Text fontSize="xl" fontWeight="bold" textAlign="center">
              Preview: {card.title}
            </Text>
            
            {/* 3:4 Aspect Ratio Card Display */}
            <AspectRatio ratio={3/4} bg="gray.50" borderRadius="lg" overflow="hidden">
              <Grid templateColumns="1fr 1fr" templateRows="1fr 1fr" gap={2} p={4}>
                {card.content.scenes.map((scene, index) => (
                  <GridItem key={scene.id} position="relative">
                    <VStack spacing={2} h="full">
                      <Box 
                        position="relative" 
                        w="full" 
                        flex={1} 
                        bg="white" 
                        borderRadius="md" 
                        overflow="hidden"
                      >
                        {scene.image_url ? (
                          <Image
                            src={scene.image_url}
                            alt={scene.description}
                            borderRadius="md"
                            objectFit="cover"
                            w="full"
                            h="full"
                          />
                        ) : (
                          <Center h="full" bg="gray.100">
                            <Spinner size="sm" />
                          </Center>
                        )}
                      </Box>
                      <Text 
                        fontSize="sm" 
                        textAlign="center" 
                        noOfLines={2}
                        color="gray.700"
                        fontWeight="medium"
                      >
                        {scene.description}
                      </Text>
                    </VStack>
                  </GridItem>
                ))}
              </Grid>
            </AspectRatio>
            
            <VStack spacing={2}>
              <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                {card.content.primary_word}
              </Text>
              {card.content.category_words && (
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Category: {card.content.category_words.join(', ')}
                </Text>
              )}
            </VStack>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3} w="full" justify="center">
            <Button 
              variant="ghost" 
              onClick={onClose}
              isDisabled={isProcessing}
            >
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

### 4. Integration with Card Generation

Create `src/components/cards/CardGenerator/CardGenerator.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Box,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast
} from '@chakra-ui/react';
import { useCardStore } from '@/stores/cardStore';
import { CardPreview } from '../CardPreview/CardPreview';
import { GenerationParams } from '@/types/cards';

export const CardGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [cardType, setCardType] = useState<'single_word' | 'category'>('single_word');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { 
    previewCard, 
    isPreviewOpen, 
    openPreview, 
    closePreview 
  } = useCardStore();
  
  const toast = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt for your flash card',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const params: GenerationParams = {
        difficulty_level: 'beginner',
        age_group: 'elementary',
        style_preference: 'cartoon',
        language: 'en'
      };

      // Start generation (this would integrate with your generation service)
      const response = await fetch('/api/cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_prompt: prompt,
          card_type: cardType,
          generation_params: params
        })
      });

      if (!response.ok) throw new Error('Generation failed');
      
      const session = await response.json();
      
      // Poll for completion
      await pollForCompletion(session.id);
      
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const pollForCompletion = async (sessionId: string) => {
    const maxAttempts = 30; // 1 minute max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/cards/generation/${sessionId}`);
        if (!response.ok) throw new Error('Failed to check status');
        
        const session = await response.json();
        
        if (session.status === 'completed' && session.cards?.[0]) {
          openPreview(session.cards[0]);
          return;
        }
        
        if (session.status === 'failed') {
          throw new Error(session.error_message || 'Generation failed');
        }
        
        if (session.status === 'processing' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        } else if (attempts >= maxAttempts) {
          throw new Error('Generation timeout');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    poll();
  };

  return (
    <Box maxW="md" mx="auto" p={6}>
      <VStack spacing={6}>
        <FormControl>
          <FormLabel>Card Prompt</FormLabel>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a word or topic (e.g., 'elephant', 'farm animals')"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Card Type</FormLabel>
          <Select 
            value={cardType} 
            onChange={(e) => setCardType(e.target.value as 'single_word' | 'category')}
          >
            <option value="single_word">Single Word Card</option>
            <option value="category">Category Card</option>
          </Select>
        </FormControl>

        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleGenerate}
          isLoading={isGenerating}
          loadingText="Generating..."
          w="full"
        >
          Generate Flash Card
        </Button>
      </VStack>

      <CardPreview 
        card={previewCard}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </Box>
  );
};
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion zustand
```

### 2. File Structure

```
src/
├── components/
│   └── cards/
│       ├── CardPreview/
│       │   ├── CardPreview.tsx
│       │   └── index.ts
│       └── CardGenerator/
│           ├── CardGenerator.tsx
│           └── index.ts
├── stores/
│   └── cardStore.ts
├── types/
│   └── cards.ts
└── services/
    └── api/
        └── cards.ts
```

### 3. Export Files

Create `src/components/cards/CardPreview/index.ts`:

```typescript
export { CardPreview } from './CardPreview';
export { default } from './CardPreview';
```

### 4. Integration in App

```typescript
// app/generate/page.tsx
import { CardGenerator } from '@/components/cards/CardGenerator';

export default function GeneratePage() {
  return <CardGenerator />;
}
```

## Common Issues & Troubleshooting

### 1. Aspect Ratio Issues
```typescript
// Ensure proper aspect ratio maintenance
<AspectRatio ratio={3/4} w="full" maxW="400px">
  {/* Content */}
</AspectRatio>
```

### 2. Image Loading States
```typescript
// Add loading states for images
const [imageLoading, setImageLoading] = useState(true);

<Image
  src={scene.image_url}
  alt={scene.description}
  onLoad={() => setImageLoading(false)}
  onError={() => setImageLoading(false)}
/>
```

### 3. Modal Responsiveness
```typescript
// Ensure modal works on mobile
<ModalContent maxW="90vw" mx={4}>
```

## Testing Recommendations

### Unit Tests
```typescript
// CardPreview.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { CardPreview } from './CardPreview';

const mockCard = {
  id: '1',
  title: 'Elephant',
  content: {
    primary_word: 'elephant',
    scenes: [
      { id: '1', description: 'Big elephant', image_url: 'test.jpg', image_prompt: 'elephant' }
    ]
  }
};

test('displays card preview correctly', () => {
  render(
    <ChakraProvider>
      <CardPreview card={mockCard} isOpen={true} onClose={() => {}} />
    </ChakraProvider>
  );
  
  expect(screen.getByText('Preview: Elephant')).toBeInTheDocument();
  expect(screen.getByText('elephant')).toBeInTheDocument();
});
```

This implementation provides a complete, production-ready CardPreviewModal component that integrates with the architecture patterns defined in the main document.