import { IUserPreferences } from '@/types/user';

export class PreferencesApiService {
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add Bearer token from auth context
        // 'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getPreferences(): Promise<IUserPreferences> {
    return this.makeRequest<IUserPreferences>('/api/user/preferences');
  }

  async updatePreferences(preferences: Partial<IUserPreferences>): Promise<IUserPreferences> {
    return this.makeRequest<IUserPreferences>('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }
}

export const preferencesApi = new PreferencesApiService();