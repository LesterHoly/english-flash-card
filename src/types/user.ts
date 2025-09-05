export interface IUserPreferences {
  skip_preview: boolean;
  default_card_type: 'single_word' | 'category';
  theme: 'light' | 'dark';
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  preferences: IUserPreferences;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export const DEFAULT_USER_PREFERENCES: IUserPreferences = {
  skip_preview: false,
  default_card_type: 'single_word',
  theme: 'light',
};