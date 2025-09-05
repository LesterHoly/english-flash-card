# CardPreviewModal Component Implementation Guide

## Overview

The CardPreviewModal is the core feature component that displays generated flash cards in a modal interface before download. This guide provides complete implementation with TypeScript interfaces, Chakra UI integration, Zustand store management, and error handling.

## Complete Component Implementation

### 1. TypeScript Interfaces

Create `/types/card.ts`:

```typescript
export interface FlashCard {
  id: string;
  type: 'single' | 'category';
  title: string;
  content: {
    words: Array<{
      word: string;
      definition: string;
      pronunciation?: string;
    }>;
    scenes?: Array<{
      description: string;
      imageUrl: string;
    }>;
    categoryTheme?: string;
  };
  imageUrl: string;
  createdAt: Date;
  userId: string;
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    ageGroup: string;
    language: string;
  };
}

export interface PreviewState {
  isOpen: boolean;
  card: FlashCard | null;
  isLoading: boolean;
  error: string | null;
  isRegenerating: boolean;
}

export interface PreviewActions {
  openPreview: (card: FlashCard) => void;
  closePreview: () => void;
  downloadCard: () => Promise<void>;
  regenerateCard: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

### 2. Zustand Store Implementation

Create `/store/usePreviewStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FlashCard, PreviewState, PreviewActions } from '../types/card';

interface PreviewStore extends PreviewState, PreviewActions {}

export const usePreviewStore = create<PreviewStore>()(
  devtools(
    (set, get) => ({
      // State
      isOpen: false,
      card: null,
      isLoading: false,
      error: null,
      isRegenerating: false,

      // Actions
      openPreview: (card: FlashCard) => {
        set({ 
          isOpen: true, 
          card, 
          error: null,
          isLoading: false 
        });
      },

      closePreview: () => {
        set({ 
          isOpen: false, 
          card: null, 
          error: null,
          isLoading: false,
          isRegenerating: false 
        });
      },

      downloadCard: async () => {
        const { card } = get();
        if (!card) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/cards/${card.id}/download`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to download card');
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${card.title}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Close preview after successful download
          get().closePreview();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Download failed',
            isLoading: false 
          });
        }
      },

      regenerateCard: async () => {
        const { card } = get();
        if (!card) return;

        set({ isRegenerating: true, error: null });

        try {
          const response = await fetch(`/api/cards/regenerate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalCardId: card.id,
              type: card.type,
              metadata: card.metadata,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to regenerate card');
          }

          const newCard: FlashCard = await response.json();
          set({ 
            card: newCard, 
            isRegenerating: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Regeneration failed',
            isRegenerating: false 
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    { name: 'preview-store' }
  )
);
```

### 3. Main CardPreviewModal Component

Create `/components/preview/CardPreviewModal.tsx`:

```typescript
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Image,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Spinner,
  useBreakpointValue,
  AspectRatio,
} from '@chakra-ui/react';
import { usePreviewStore } from '../../store/usePreviewStore';
import { CardContent } from './CardContent';
import { PreviewActions } from './PreviewActions';

export const CardPreviewModal: React.FC = () => {
  const {
    isOpen,
    card,
    isLoading,
    error,
    isRegenerating,
    closePreview,
  } = usePreviewStore();

  // Responsive modal size
  const modalSize = useBreakpointValue({ 
    base: 'sm', 
    md: 'md', 
    lg: 'lg' 
  });

  // Responsive card dimensions maintaining 3:4 aspect ratio
  const cardMaxWidth = useBreakpointValue({ 
    base: '280px', 
    md: '360px', 
    lg: '420px' 
  });

  if (!card) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={closePreview}
      size={modalSize}
      closeOnOverlayClick={!isLoading && !isRegenerating}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="fit-content" bg="white">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold">
              Card Preview
            </Text>
            <Text fontSize="sm" color="gray.600">
              {card.type === 'single' ? 'Single Word Card' : 'Category Card'}
            </Text>
          </VStack>
        </ModalHeader>
        
        <ModalCloseButton 
          isDisabled={isLoading || isRegenerating}
        />
        
        <ModalBody px={6} py={4}>
          <VStack spacing={4} align="center">
            {/* Error Display */}
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {/* Card Preview Container */}
            <Box
              position="relative"
              maxW={cardMaxWidth}
              w="100%"
            >
              {/* Loading Overlay */}
              {(isLoading || isRegenerating) && (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  bg="whiteAlpha.900"
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="md"
                >
                  <VStack spacing={3}>
                    <Spinner size="lg" color="blue.500" />
                    <Text fontSize="sm" color="gray.600">
                      {isRegenerating ? 'Regenerating card...' : 'Processing...'}
                    </Text>
                  </VStack>
                </Box>
              )}

              {/* 3:4 Aspect Ratio Container */}
              <AspectRatio ratio={3/4}>
                <Box
                  bg="white"
                  borderRadius="md"
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  overflow="hidden"
                >
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={`${card.title} flash card`}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                      fallback={
                        <CardContent card={card} />
                      }
                    />
                  ) : (
                    <CardContent card={card} />
                  )}
                </Box>
              </AspectRatio>
            </Box>

            {/* Card Information */}
            <VStack spacing={2} align="center" w="100%">
              <Text fontSize="md" fontWeight="semibold" textAlign="center">
                {card.title}
              </Text>
              <HStack spacing={4} fontSize="sm" color="gray.600">
                <Text>
                  Difficulty: {card.metadata.difficulty}
                </Text>
                <Text>
                  Age: {card.metadata.ageGroup}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <PreviewActions />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
```

### 4. Supporting Components

Create `/components/preview/CardContent.tsx`:

```typescript
import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { FlashCard } from '../../types/card';

interface CardContentProps {
  card: FlashCard;
}

export const CardContent: React.FC<CardContentProps> = ({ card }) => {
  if (card.type === 'single') {
    return <SingleWordCardContent card={card} />;
  }
  
  return <CategoryCardContent card={card} />;
};

const SingleWordCardContent: React.FC<CardContentProps> = ({ card }) => {
  const primaryWord = card.content.words[0];

  return (
    <VStack spacing={3} p={4} h="100%" justify="space-between">
      {/* Main Word */}
      <VStack spacing={2}>
        <Text 
          fontSize="2xl" 
          fontWeight="bold" 
          textAlign="center"
          color="blue.700"
        >
          {primaryWord?.word}
        </Text>
        {primaryWord?.pronunciation && (
          <Text 
            fontSize="sm" 
            color="gray.600"
            fontStyle="italic"
          >
            /{primaryWord.pronunciation}/
          </Text>
        )}
      </VStack>

      {/* Definition */}
      <Text 
        fontSize="md" 
        textAlign="center"
        color="gray.800"
        flex={1}
        display="flex"
        alignItems="center"
      >
        {primaryWord?.definition}
      </Text>

      {/* Scenes Preview */}
      {card.content.scenes && card.content.scenes.length > 0 && (
        <Grid templateColumns="1fr 1fr" gap={2} w="100%">
          {card.content.scenes.slice(0, 4).map((scene, index) => (
            <GridItem key={index}>
              <Box
                bg="blue.50"
                p={2}
                borderRadius="md"
                textAlign="center"
              >
                <Text fontSize="xs" color="blue.700">
                  Scene {index + 1}
                </Text>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {scene.description.substring(0, 30)}...
                </Text>
              </Box>
            </GridItem>
          ))}
        </Grid>
      )}
    </VStack>
  );
};

const CategoryCardContent: React.FC<CardContentProps> = ({ card }) => {
  return (
    <VStack spacing={3} p={4} h="100%">
      {/* Category Title */}
      <Text 
        fontSize="lg" 
        fontWeight="bold" 
        textAlign="center"
        color="green.700"
      >
        {card.content.categoryTheme || card.title}
      </Text>

      {/* Words Grid */}
      <Grid 
        templateColumns="1fr 1fr" 
        gap={3} 
        w="100%" 
        flex={1}
      >
        {card.content.words.slice(0, 6).map((wordItem, index) => (
          <GridItem key={index}>
            <VStack
              bg="green.50"
              p={3}
              borderRadius="md"
              spacing={1}
              textAlign="center"
              h="100%"
              justify="center"
            >
              <Text 
                fontSize="sm" 
                fontWeight="semibold"
                color="green.700"
              >
                {wordItem.word}
              </Text>
              <Text 
                fontSize="xs" 
                color="gray.600"
                noOfLines={2}
              >
                {wordItem.definition}
              </Text>
            </VStack>
          </GridItem>
        ))}
      </Grid>

      {/* Additional words indicator */}
      {card.content.words.length > 6 && (
        <Text fontSize="xs" color="gray.500">
          +{card.content.words.length - 6} more words
        </Text>
      )}
    </VStack>
  );
};
```

Create `/components/preview/PreviewActions.tsx`:

```typescript
import React from 'react';
import {
  HStack,
  Button,
  Tooltip,
} from '@chakra-ui/react';
import { DownloadIcon, RepeatIcon } from '@chakra-ui/icons';
import { usePreviewStore } from '../../store/usePreviewStore';

export const PreviewActions: React.FC = () => {
  const {
    isLoading,
    isRegenerating,
    error,
    downloadCard,
    regenerateCard,
    closePreview,
  } = usePreviewStore();

  const isDisabled = isLoading || isRegenerating;

  return (
    <HStack spacing={3}>
      {/* Cancel Button */}
      <Button
        variant="ghost"
        onClick={closePreview}
        isDisabled={isDisabled}
      >
        Cancel
      </Button>

      {/* Regenerate Button */}
      <Tooltip
        label="Generate a new version of this card"
        hasArrow
        placement="top"
      >
        <Button
          leftIcon={<RepeatIcon />}
          variant="outline"
          colorScheme="orange"
          onClick={regenerateCard}
          isLoading={isRegenerating}
          loadingText="Regenerating..."
          isDisabled={isLoading}
        >
          Regenerate
        </Button>
      </Tooltip>

      {/* Download Button */}
      <Tooltip
        label="Download this card as PDF"
        hasArrow
        placement="top"
      >
        <Button
          leftIcon={<DownloadIcon />}
          colorScheme="blue"
          onClick={downloadCard}
          isLoading={isLoading}
          loadingText="Downloading..."
          isDisabled={isRegenerating || !!error}
        >
          Download
        </Button>
      </Tooltip>
    </HStack>
  );
};
```

## Integration with Generation Flow

### Hook for Preview Integration

Create `/hooks/usePreview.ts`:

```typescript
import { useCallback } from 'react';
import { usePreviewStore } from '../store/usePreviewStore';
import { FlashCard } from '../types/card';

export const usePreview = () => {
  const { openPreview, closePreview } = usePreviewStore();

  const showPreview = useCallback((card: FlashCard) => {
    openPreview(card);
  }, [openPreview]);

  const hidePreview = useCallback(() => {
    closePreview();
  }, [closePreview]);

  return {
    showPreview,
    hidePreview,
  };
};
```

### Integration Example in Generation Component

```typescript
// In your existing card generation component
import { usePreview } from '../hooks/usePreview';

const CardGenerator: React.FC = () => {
  const { showPreview } = usePreview();
  
  const handleGenerationComplete = (generatedCard: FlashCard) => {
    // Instead of auto-downloading, show preview
    showPreview(generatedCard);
  };

  // Rest of your generation logic...
};
```

## Testing Recommendations

### 1. Unit Tests

Create `/components/preview/__tests__/CardPreviewModal.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { CardPreviewModal } from '../CardPreviewModal';
import { usePreviewStore } from '../../../store/usePreviewStore';

// Mock the store
jest.mock('../../../store/usePreviewStore');

const mockCard = {
  id: '1',
  type: 'single' as const,
  title: 'Test Card',
  content: {
    words: [
      {
        word: 'Apple',
        definition: 'A red or green fruit',
        pronunciation: 'ˈæpəl'
      }
    ]
  },
  imageUrl: 'https://example.com/apple.jpg',
  createdAt: new Date(),
  userId: 'user1',
  metadata: {
    difficulty: 'beginner' as const,
    ageGroup: '3-5',
    language: 'en'
  }
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('CardPreviewModal', () => {
  beforeEach(() => {
    (usePreviewStore as jest.Mock).mockReturnValue({
      isOpen: true,
      card: mockCard,
      isLoading: false,
      error: null,
      isRegenerating: false,
      closePreview: jest.fn(),
      downloadCard: jest.fn(),
      regenerateCard: jest.fn(),
    });
  });

  it('renders card preview correctly', () => {
    renderWithProvider(<CardPreviewModal />);
    
    expect(screen.getByText('Card Preview')).toBeInTheDocument();
    expect(screen.getByText('Single Word Card')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('A red or green fruit')).toBeInTheDocument();
  });

  it('handles download action', async () => {
    const mockDownload = jest.fn();
    (usePreviewStore as jest.Mock).mockReturnValue({
      ...usePreviewStore(),
      downloadCard: mockDownload,
    });

    renderWithProvider(<CardPreviewModal />);
    
    fireEvent.click(screen.getByText('Download'));
    
    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalled();
    });
  });

  it('shows loading state during regeneration', () => {
    (usePreviewStore as jest.Mock).mockReturnValue({
      ...usePreviewStore(),
      isRegenerating: true,
    });

    renderWithProvider(<CardPreviewModal />);
    
    expect(screen.getByText('Regenerating card...')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

```typescript
// Test preview integration with generation flow
describe('Preview Integration', () => {
  it('opens preview after successful generation', async () => {
    // Test that generation completion triggers preview
  });

  it('maintains 3:4 aspect ratio across screen sizes', () => {
    // Test responsive behavior
  });

  it('handles regeneration workflow correctly', async () => {
    // Test regenerate -> new card -> preview update
  });
});
```

## Common Troubleshooting

### Issue: Modal not displaying correctly on mobile
**Solution**: Verify Chakra UI modal responsive props and test on actual devices

### Issue: Card aspect ratio breaking
**Solution**: Use AspectRatio component wrapper and test with various content lengths

### Issue: Store state not persisting
**Solution**: Check Zustand devtools integration and verify state updates

### Issue: Download failing silently
**Solution**: Add proper error boundaries and check network tab for API errors

## Performance Considerations

1. **Image Loading**: Implement lazy loading for card images
2. **Store Updates**: Use Zustand's selective subscriptions to prevent unnecessary re-renders
3. **Modal Animation**: Leverage Chakra UI's built-in animations for smooth transitions
4. **Memory Management**: Clean up blob URLs after download completion

## Next Steps

1. Integrate with existing card generation API
2. Add accessibility features (ARIA labels, keyboard navigation)
3. Implement preview settings (skip preview toggle)
4. Add analytics tracking for preview interactions
5. Consider adding batch preview for multiple cards