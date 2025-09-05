import { create } from 'zustand';
import { IFlashCard } from '@/types/cards';
import { cardsApi } from '@/services/api/cards';
import { preferencesApi } from '@/services/api/preferences';

interface CardState {
  previewCard: IFlashCard | null;
  isPreviewOpen: boolean;
  isGenerating: boolean;
  isDownloading: boolean;
  isRegenerating: boolean;
  openPreview: (card: IFlashCard) => void;
  closePreview: () => void;
  setGenerating: (generating: boolean) => void;
  updateCard: (card: IFlashCard) => void;
  approveCard: (cardId: string) => Promise<void>;
  regenerateCard: (cardId: string) => Promise<void>;
  downloadCard: (cardId: string) => Promise<void>;
  handleGenerationComplete: (card: IFlashCard) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  previewCard: null,
  isPreviewOpen: false,
  isGenerating: false,
  isDownloading: false,
  isRegenerating: false,

  openPreview: (card: IFlashCard) => {
    set({
      previewCard: card,
      isPreviewOpen: true
    });
  },

  closePreview: () => {
    set({
      isPreviewOpen: false,
      previewCard: null
    });
  },

  setGenerating: (generating: boolean) => {
    set({ isGenerating: generating });
  },

  updateCard: (card: IFlashCard) => {
    const { previewCard } = get();
    if (previewCard && previewCard.id === card.id) {
      set({ previewCard: card });
    }
  },

  handleGenerationComplete: async (card: IFlashCard) => {
    try {
      // Check user preferences to determine workflow
      const preferences = await preferencesApi.getPreferences();
      
      if (preferences.skip_preview) {
        // Auto-approve and download without showing preview
        await get().approveCard(card.id);
      } else {
        // Show preview modal
        get().openPreview(card);
      }
    } catch (error) {
      console.error('Failed to check preferences, defaulting to preview:', error);
      // Fallback to showing preview on error
      get().openPreview(card);
    }
  },

  approveCard: async (cardId: string) => {
    const { previewCard } = get();
    if (!previewCard || previewCard.id !== cardId) return;

    try {
      set({ isDownloading: true });
      
      // Update card status to approved
      const updatedCard: IFlashCard = {
        ...previewCard,
        status: 'approved',
        updated_at: new Date().toISOString()
      };
      set({ previewCard: updatedCard });

      // For now, just simulate the download
      // In real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark as downloaded
      const downloadedCard: IFlashCard = {
        ...updatedCard,
        status: 'downloaded',
        updated_at: new Date().toISOString()
      };
      set({ previewCard: downloadedCard });

    } catch (error) {
      console.error('Failed to approve card:', error);
      throw error;
    } finally {
      set({ isDownloading: false });
    }
  },

  regenerateCard: async (cardId: string) => {
    const { previewCard, closePreview } = get();
    if (!previewCard || previewCard.id !== cardId) return;

    try {
      set({ isRegenerating: true });
      closePreview();
      
      // Simulate regeneration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new card with same generation params
      const newCard: IFlashCard = {
        ...previewCard,
        id: Date.now().toString(),
        status: 'preview',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Handle the new card based on preferences
      await get().handleGenerationComplete(newCard);

    } catch (error) {
      console.error('Failed to regenerate card:', error);
      throw error;
    } finally {
      set({ isRegenerating: false });
    }
  },

  downloadCard: async (cardId: string) => {
    try {
      set({ isDownloading: true });
      
      // For now, simulate download
      // In real implementation: const { blob, filename } = await cardsApi.downloadCard(cardId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate file download
      const mockBlob = new Blob(['Mock PDF content'], { type: 'application/pdf' });
      const url = URL.createObjectURL(mockBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `card-${cardId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download card:', error);
      throw error;
    } finally {
      set({ isDownloading: false });
    }
  },
}));