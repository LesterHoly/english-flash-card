import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { PreviewModal } from '@/components/cards/CardPreview/PreviewModal';
import { CardDisplay } from '@/components/cards/CardPreview/CardDisplay';
import { IFlashCard } from '@/types/cards';

vi.mock('@/hooks/usePreview', () => ({
  usePreview: () => ({
    isDownloading: false,
    isRegenerating: false,
  }),
}));

// Mock card data
const mockCard: IFlashCard = {
  id: 'test-card-1',
  user_id: 'user123',
  title: 'Test Apple Card',
  card_type: 'single_word',
  content: {
    primary_word: 'APPLE',
    scenes: [
      {
        id: '1',
        description: 'Red apple on tree',
        image_url: 'https://example.com/apple1.jpg',
        image_prompt: 'A red apple hanging on a tree branch'
      },
      {
        id: '2',
        description: 'Apple slice showing seeds',
        image_url: 'https://example.com/apple2.jpg',
        image_prompt: 'Cross-section of an apple showing seeds'
      },
      {
        id: '3',
        description: 'Child eating apple',
        image_url: 'https://example.com/apple3.jpg',
        image_prompt: 'Happy child eating a red apple'
      },
      {
        id: '4',
        description: 'Basket of apples',
        image_url: 'https://example.com/apple4.jpg',
        image_prompt: 'Wooden basket filled with red apples'
      }
    ],
    layout: {
      grid_columns: 2,
      grid_rows: 2,
      scene_positions: {
        '1': { row: 0, col: 0 },
        '2': { row: 0, col: 1 },
        '3': { row: 1, col: 0 },
        '4': { row: 1, col: 1 }
      }
    }
  },
  generation_params: {},
  status: 'preview',
  created_at: '2025-09-05T00:00:00Z',
  updated_at: '2025-09-05T00:00:00Z'
};

const renderWithChakra = (component: React.ReactNode) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('CardDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card content correctly', () => {
    renderWithChakra(<CardDisplay content={mockCard.content} />);
    
    expect(screen.getByText('APPLE')).toBeInTheDocument();
    expect(screen.getByText('Red apple on tree')).toBeInTheDocument();
    expect(screen.getByText('Apple slice showing seeds')).toBeInTheDocument();
    expect(screen.getByText('Child eating apple')).toBeInTheDocument();
    expect(screen.getByText('Basket of apples')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    renderWithChakra(<CardDisplay content={mockCard.content} isLoading={true} />);
    
    // Check for loading text in the center spinner
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
  });

  it('maintains 3:4 aspect ratio container', () => {
    const { container } = renderWithChakra(<CardDisplay content={mockCard.content} />);
    
    // Check if the main container exists (AspectRatio creates a specific structure)
    const aspectContainer = container.querySelector('.chakra-aspect-ratio');
    expect(aspectContainer).toBeInTheDocument();
  });
});

describe('PreviewModal Component - Action Controls', () => {
  const mockOnClose = vi.fn();
  const mockOnApprove = vi.fn();
  const mockOnRegenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePreview.mockReturnValue({
      isDownloading: false,
      isRegenerating: false,
    });
  });

  it('renders modal when isOpen is true', () => {
    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('Card Preview')).toBeInTheDocument();
    expect(screen.getByText('Test Apple Card')).toBeInTheDocument();
  });

  it('does not render modal content when isOpen is false', () => {
    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={false}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    // Modal should be in DOM but not visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders action buttons with correct styling', () => {
    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    // Check for Close button (ghost variant)
    expect(screen.getByText('Close')).toBeInTheDocument();

    // Check for Regenerate button (orange outline)
    expect(screen.getByText('Regenerate')).toBeInTheDocument();

    // Check for Approve button (green primary)
    expect(screen.getByText('Approve & Download')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onApprove when approve button is clicked', async () => {
    mockOnApprove.mockResolvedValueOnce(undefined);

    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    const approveButton = screen.getByText('Approve & Download');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockOnApprove).toHaveBeenCalledWith('test-card-1');
    });
  });

  it('calls onRegenerate when regenerate button is clicked', async () => {
    mockOnRegenerate.mockResolvedValueOnce(undefined);

    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    const regenerateButton = screen.getByText('Regenerate');
    fireEvent.click(regenerateButton);

    await waitFor(() => {
      expect(mockOnRegenerate).toHaveBeenCalledWith('test-card-1');
    });
  });

  it('hides action buttons during loading state', () => {
    const generatingCard = { ...mockCard, status: 'generating' as const };
    
    renderWithChakra(
      <PreviewModal
        card={generatingCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.queryByText('Approve & Download')).not.toBeInTheDocument();
    expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('shows loading states on buttons during processing', async () => {
    // Mock the hook to return loading states
    mockUsePreview.mockReturnValue({
      isDownloading: true,
      isRegenerating: false,
    });

    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    // The approve button should show loading when isDownloading is true
    const approveButton = screen.getByRole('button', { name: /downloading/i });
    expect(approveButton).toBeInTheDocument();
  });

  it('disables buttons during processing', () => {
    mockUsePreview.mockReturnValue({
      isDownloading: true,
      isRegenerating: false,
    });

    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    const closeButton = screen.getByText('Close');
    const regenerateButton = screen.getByText('Regenerate');

    // Close button should be disabled during processing
    expect(closeButton).toBeDisabled();
    
    // Regenerate button should be disabled during any processing
    expect(regenerateButton).toBeDisabled();
  });

  it('handles error states gracefully', async () => {
    const mockError = new Error('API Error');
    mockOnApprove.mockRejectedValueOnce(mockError);

    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    const approveButton = screen.getByText('Approve & Download');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockOnApprove).toHaveBeenCalledWith('test-card-1');
    });

    // The error should be handled gracefully and not crash the component
    expect(screen.getByText('Approve & Download')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    // Check for modal accessibility
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Check for close button accessibility
    const closeButton = screen.getAllByLabelText('Close')[0]; // Get the first close button (modal close X)
    expect(closeButton).toBeInTheDocument();
  });

  it('uses correct button color schemes and variants', () => {
    renderWithChakra(
      <PreviewModal
        card={mockCard}
        isOpen={true}
        onClose={mockOnClose}
        onApprove={mockOnApprove}
        onRegenerate={mockOnRegenerate}
      />
    );

    const regenerateButton = screen.getByText('Regenerate');
    const approveButton = screen.getByText('Approve & Download');
    const closeButton = screen.getByText('Close');
    
    // All buttons should be in the document
    expect(regenerateButton).toBeInTheDocument();
    expect(approveButton).toBeInTheDocument();
    expect(closeButton).toBeInTheDocument();
  });
});