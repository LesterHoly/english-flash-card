import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { PreferencesForm } from '@/components/forms/PreferencesForm';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';

// Mock the usePreferences hook
const mockToggleSkipPreview = vi.fn();
const mockUpdatePreferences = vi.fn();

vi.mock('@/hooks/usePreferences', () => ({
  usePreferences: vi.fn(() => ({
    preferences: DEFAULT_USER_PREFERENCES,
    isLoading: false,
    isUpdating: false,
    toggleSkipPreview: mockToggleSkipPreview,
    updatePreferences: mockUpdatePreferences,
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe('PreferencesForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders preferences form correctly', () => {
    render(
      <PreferencesForm />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Card Generation Preferences')).toBeInTheDocument();
    expect(screen.getByText('Skip Preview Modal')).toBeInTheDocument();
    expect(screen.getByText(/When enabled, cards will download immediately/)).toBeInTheDocument();
  });

  it('displays workflow differences explanation', () => {
    render(
      <PreferencesForm />,
      { wrapper: createWrapper() }
    );

    const workflowDifferences = screen.getAllByText('Workflow Differences');
    expect(workflowDifferences.length).toBeGreaterThan(0);
    const withPreview = screen.getAllByText(/With Preview:/);
    expect(withPreview.length).toBeGreaterThan(0);
    const skipPreview = screen.getAllByText(/Skip Preview:/);
    expect(skipPreview.length).toBeGreaterThan(0);
  });

  it('shows manual preview availability notice', () => {
    render(
      <PreferencesForm />,
      { wrapper: createWrapper() }
    );

    const notices = screen.getAllByText(/You can still manually preview any card/);
    expect(notices.length).toBeGreaterThan(0);
  });

  it('calls toggleSkipPreview when switch is clicked', async () => {
    render(
      <PreferencesForm />,
      { wrapper: createWrapper() }
    );

    const switchElement = screen.getByRole('checkbox');
    fireEvent.click(switchElement);

    await waitFor(() => {
      expect(mockToggleSkipPreview).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state correctly', () => {
    // Update the mock to return loading state
    vi.mocked(vi.importActual('@/hooks/usePreferences')).usePreferences = vi.fn(() => ({
      preferences: DEFAULT_USER_PREFERENCES,
      isLoading: true,
      isUpdating: false,
      toggleSkipPreview: mockToggleSkipPreview,
      updatePreferences: mockUpdatePreferences,
    }));

    render(
      <PreferencesForm />,
      { wrapper: createWrapper() }
    );

    // Should show skeleton loaders when loading
    const skeletons = document.querySelectorAll('.chakra-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('disables switch during update', () => {
    // Update the mock to return updating state
    vi.mocked(vi.importActual('@/hooks/usePreferences')).usePreferences = vi.fn(() => ({
      preferences: DEFAULT_USER_PREFERENCES,
      isLoading: false,
      isUpdating: true,
      toggleSkipPreview: mockToggleSkipPreview,
      updatePreferences: mockUpdatePreferences,
    }));

    render(
      <PreferencesForm />,
      { wrapper: createWrapper() }
    );

    const switchElement = screen.getByRole('checkbox');
    expect(switchElement).toBeDisabled();
  });

  it('reflects current preferences state', () => {
    // Update the mock to return preferences with skip_preview enabled
    vi.mocked(vi.importActual('@/hooks/usePreferences')).usePreferences = vi.fn(() => ({
      preferences: { ...DEFAULT_USER_PREFERENCES, skip_preview: true },
      isLoading: false,
      isUpdating: false,
      toggleSkipPreview: mockToggleSkipPreview,
      updatePreferences: mockUpdatePreferences,
    }));

    render(
      <PreferencesForm />,
      { wrapper: createWrapper() }
    );

    const switchElement = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchElement.checked).toBe(true);
  });

  it('has proper accessibility attributes', () => {
    render(
      <PreferencesForm />,
      { wrapper: createWrapper() }
    );

    const switchElement = screen.getByRole('checkbox');
    const label = screen.getByText('Skip Preview Modal');
    
    expect(switchElement).toHaveAttribute('id', 'skip-preview');
    expect(label.closest('label')).toHaveAttribute('for', 'skip-preview');
  });
});