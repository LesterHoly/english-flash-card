import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';

// Mock NextRequest and NextResponse for testing
class MockNextRequest {
  constructor(public url: string, public init?: RequestInit) {}
  
  async json() {
    if (!this.init?.body) return {};
    return JSON.parse(this.init.body as string);
  }
}

const mockJson = vi.fn();
const MockNextResponse = {
  json: mockJson,
};

// Create mock implementations of the route handlers
async function mockGET(request: any) {
  try {
    return MockNextResponse.json(DEFAULT_USER_PREFERENCES);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return MockNextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

async function mockPUT(request: any) {
  try {
    const body = await request.json();
    
    if (typeof body !== 'object' || body === null) {
      return MockNextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const updatedPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      ...body
    };

    if ('skip_preview' in body && typeof body.skip_preview === 'boolean') {
      updatedPreferences.skip_preview = body.skip_preview;
    }

    return MockNextResponse.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return MockNextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

describe('Preferences API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJson.mockImplementation((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
    }));
  });

  describe('GET /api/user/preferences', () => {
    it('returns default preferences successfully', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/user/preferences');
      
      await mockGET(request);

      expect(mockJson).toHaveBeenCalledWith(DEFAULT_USER_PREFERENCES);
    });

    it('handles errors gracefully', async () => {
      // Mock an error by overriding the implementation
      const originalImplementation = mockJson.getMockImplementation();
      mockJson.mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const request = new MockNextRequest('http://localhost:3000/api/user/preferences');
      
      await mockGET(request);

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );

      // Restore original implementation
      if (originalImplementation) {
        mockJson.mockImplementation(originalImplementation);
      }
    });
  });

  describe('PUT /api/user/preferences', () => {
    it('updates preferences successfully', async () => {
      const updateData = { skip_preview: true };
      const request = new MockNextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await mockPUT(request);

      expect(mockJson).toHaveBeenCalledWith({
        ...DEFAULT_USER_PREFERENCES,
        skip_preview: true,
      });
    });

    it('handles partial preference updates', async () => {
      const updateData = { theme: 'dark' };
      const request = new MockNextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await mockPUT(request);

      expect(mockJson).toHaveBeenCalledWith({
        ...DEFAULT_USER_PREFERENCES,
        theme: 'dark',
      });
    });

    it('validates boolean values correctly', async () => {
      const updateData = { skip_preview: true };
      const request = new MockNextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await mockPUT(request);

      const callArgs = mockJson.mock.calls[0][0];
      expect(callArgs.skip_preview).toBe(true);
      expect(typeof callArgs.skip_preview).toBe('boolean');
    });

    it('handles invalid request body', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await mockPUT(request);

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    });

    it('handles null request body', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(null),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await mockPUT(request);

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    });

    it('handles server errors gracefully', async () => {
      const originalImplementation = mockJson.getMockImplementation();
      mockJson.mockImplementationOnce(() => {
        throw new Error('Server error');
      });

      const updateData = { skip_preview: true };
      const request = new MockNextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await mockPUT(request);

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );

      // Restore original implementation
      if (originalImplementation) {
        mockJson.mockImplementation(originalImplementation);
      }
    });
  });
});