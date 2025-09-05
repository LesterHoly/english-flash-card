import { useCardStore } from '@/stores/cardStore';

export const usePreview = () => {
  const { 
    previewCard, 
    isPreviewOpen, 
    isDownloading,
    isRegenerating,
    openPreview, 
    closePreview,
    updateCard,
    approveCard,
    regenerateCard
  } = useCardStore();

  const handleApprove = async (cardId: string) => {
    try {
      await approveCard(cardId);
    } catch (error) {
      console.error('Failed to approve card:', error);
      // In a real app, you'd show a toast notification here
      throw error;
    }
  };

  const handleRegenerate = async (cardId: string) => {
    try {
      await regenerateCard(cardId);
    } catch (error) {
      console.error('Failed to regenerate card:', error);
      // In a real app, you'd show a toast notification here
      throw error;
    }
  };

  return {
    previewCard,
    isPreviewOpen,
    isDownloading,
    isRegenerating,
    openPreview,
    closePreview,
    handleApprove,
    handleRegenerate,
  };
};