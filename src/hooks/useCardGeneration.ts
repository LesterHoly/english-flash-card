import { useCardStore } from '@/stores/cardStore';
import { IFlashCard } from '@/types/cards';

export const useCardGeneration = () => {
  const { isGenerating, setGenerating, handleGenerationComplete } = useCardStore();

  const generateCard = async (params: any): Promise<IFlashCard> => {
    setGenerating(true);
    
    try {
      // Mock card generation - in real implementation this would call your API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate generation time
      
      const mockCard: IFlashCard = {
        id: Date.now().toString(),
        user_id: 'user123',
        title: `Flash Card - ${params.word || 'Example'}`,
        card_type: 'single_word',
        content: {
          primary_word: params.word || 'APPLE',
          scenes: [
            {
              id: '1',
              description: 'Red apple on tree',
              image_url: 'https://via.placeholder.com/300x400?text=Apple+1',
              image_prompt: 'A red apple hanging on a tree branch'
            },
            {
              id: '2', 
              description: 'Apple slice showing seeds',
              image_url: 'https://via.placeholder.com/300x400?text=Apple+2',
              image_prompt: 'Cross-section of an apple showing seeds'
            },
            {
              id: '3',
              description: 'Child eating apple',
              image_url: 'https://via.placeholder.com/300x400?text=Apple+3', 
              image_prompt: 'Happy child eating a red apple'
            },
            {
              id: '4',
              description: 'Basket of apples',
              image_url: 'https://via.placeholder.com/300x400?text=Apple+4',
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
        generation_params: params,
        status: 'preview',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Handle generation completion based on user preferences
      await handleGenerationComplete(mockCard);
      
      return mockCard;
    } finally {
      setGenerating(false);
    }
  };

  return {
    isGenerating,
    generateCard
  };
};