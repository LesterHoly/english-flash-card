import { IFlashCard } from '@/types/cards';

export interface DownloadResponse {
  blob: Blob;
  filename: string;
}

export interface ApproveResponse {
  card: IFlashCard;
  success: boolean;
}

export class CardsApiService {
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

  async downloadCard(cardId: string, format: 'pdf' = 'pdf'): Promise<DownloadResponse> {
    const response = await fetch(`/api/cards/${cardId}/download?format=${format}`, {
      method: 'POST',
      headers: {
        // TODO: Add Bearer token from auth context
        // 'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const filename = response.headers.get('Content-Disposition')?.split('filename=')[1] || `card-${cardId}.${format}`;

    return { blob, filename };
  }

  async approveCard(cardId: string): Promise<ApproveResponse> {
    return this.makeRequest<ApproveResponse>(`/api/cards/${cardId}/approve`, {
      method: 'POST',
    });
  }

  async generateCard(params: any): Promise<{ sessionId: string }> {
    return this.makeRequest<{ sessionId: string }>('/api/cards/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const cardsApi = new CardsApiService();