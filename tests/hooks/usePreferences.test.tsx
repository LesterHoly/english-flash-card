import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { usePreferences } from '@/hooks/usePreferences';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';

vi.mock('@/services/api/preferences', () => ({
  preferencesApi: {
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

const { preferencesApi } = await import('@/services/api/preferences');
const mockGetPreferences = vi.mocked(preferencesApi.getPreferences);
const mockUpdatePreferences = vi.mocked(preferencesApi.updatePreferences);

// Mock toast
const mockToast = vi.fn();
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        {children}
      </ChakraProvider>
    </QueryClientProvider>
  );
};

describe('usePreferences Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default preferences initially', async () => {
    mockGetPreferences.mockResolvedValue(DEFAULT_USER_PREFERENCES);

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    // Initially should have default preferences
    expect(result.current.preferences).toEqual(DEFAULT_USER_PREFERENCES);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.preferences).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('handles API call success', async () => {
    const mockPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      skip_preview: true,
    };

    mockGetPreferences.mockResolvedValue(mockPreferences);

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.preferences.skip_preview).toBe(true);
    });
  });

  it('fallback to defaults when API call fails', async () => {
    mockGetPreferences.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still have default preferences as fallback
    expect(result.current.preferences).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('updates preferences successfully', async () => {
    mockGetPreferences.mockResolvedValue(DEFAULT_USER_PREFERENCES);
    mockUpdatePreferences.mockResolvedValue({
      ...DEFAULT_USER_PREFERENCES,
      skip_preview: true,
    });

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updatePreferences({ skip_preview: true });
    });

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith({ skip_preview: true });
    });
  });

  it('handles preference update errors', async () => {
    mockGetPreferences.mockResolvedValue(DEFAULT_USER_PREFERENCES);
    mockUpdatePreferences.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updatePreferences({ skip_preview: true });
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Update Failed',
        })
      );
    });
  });

  it('toggleSkipPreview calls updatePreferences correctly', async () => {
    mockGetPreferences.mockResolvedValue(DEFAULT_USER_PREFERENCES);
    mockUpdatePreferences.mockResolvedValue({
      ...DEFAULT_USER_PREFERENCES,
      skip_preview: true,
    });

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.toggleSkipPreview();
    });

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith({ skip_preview: true });
    });
  });

  it('provides correct loading states', async () => {
    let resolvePromise: (value: any) => void;
    const loadingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockGetPreferences.mockReturnValue(loadingPromise);

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    // Should start with loading true and default preferences
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.preferences).toEqual(DEFAULT_USER_PREFERENCES);

    // Resolve the promise
    act(() => {
      resolvePromise(DEFAULT_USER_PREFERENCES);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('shows updating state during mutations', async () => {
    mockGetPreferences.mockResolvedValue(DEFAULT_USER_PREFERENCES);
    
    let resolveUpdatePromise: (value: any) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdatePromise = resolve;
    });
    mockUpdatePreferences.mockReturnValue(updatePromise);

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updatePreferences({ skip_preview: true });
    });

    // Should show updating state
    expect(result.current.isUpdating).toBe(true);

    // Resolve the update promise
    act(() => {
      resolveUpdatePromise({ ...DEFAULT_USER_PREFERENCES, skip_preview: true });
    });

    await waitFor(() => {
      expect(result.current.isUpdating).toBe(false);
    });
  });
});