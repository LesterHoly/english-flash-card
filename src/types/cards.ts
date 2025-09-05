export type CardType = 'single_word' | 'category';

export type CardStatus = 'generating' | 'preview' | 'approved' | 'downloaded';

export interface IScene {
  id: string;
  description: string;
  image_url: string;
  image_prompt: string;
}

export interface ICardLayout {
  grid_columns: number;
  grid_rows: number;
  scene_positions: { [key: string]: { row: number; col: number } };
}

export interface ICardContent {
  primary_word: string;
  scenes: IScene[];
  category_words?: string[];
  layout: ICardLayout;
}

export interface IGenerationParams {
  style?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  image_style?: string;
}

export interface IFlashCard {
  id: string;
  user_id: string;
  title: string;
  card_type: CardType;
  content: ICardContent;
  generation_params: IGenerationParams;
  status: CardStatus;
  created_at: string;
  updated_at: string;
}