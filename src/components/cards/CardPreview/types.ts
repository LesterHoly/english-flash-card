import { IFlashCard } from '@/types/cards';

export interface CardPreviewProps {
  card: IFlashCard;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (cardId: string) => Promise<void>;
  onRegenerate: (cardId: string) => Promise<void>;
}