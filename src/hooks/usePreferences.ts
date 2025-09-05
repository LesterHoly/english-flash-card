import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '@/services/api/preferences';
import { IUserPreferences, DEFAULT_USER_PREFERENCES } from '@/types/user';
import { useToast } from '@chakra-ui/react';

export const usePreferences = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Query for getting preferences
  const {
    data: preferences = DEFAULT_USER_PREFERENCES,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: preferencesApi.getPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      return failureCount < 2;
    },
    initialData: DEFAULT_USER_PREFERENCES, // Fallback to defaults
  });

  // Mutation for updating preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: preferencesApi.updatePreferences,
    onMutate: async (newPreferences) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user', 'preferences'] });

      // Snapshot the previous value
      const previousPreferences = queryClient.getQueryData(['user', 'preferences']);

      // Optimistically update to the new value
      queryClient.setQueryData(['user', 'preferences'], (old: IUserPreferences) => ({
        ...old,
        ...newPreferences,
      }));

      // Return a context object with the snapshotted value
      return { previousPreferences };
    },
    onError: (error, newPreferences, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['user', 'preferences'], context?.previousPreferences);
      
      toast({
        title: 'Update Failed',
        description: 'Failed to save preferences. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Preferences Saved',
        description: 'Your preferences have been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });

  const updatePreferences = (newPreferences: Partial<IUserPreferences>) => {
    updatePreferencesMutation.mutate(newPreferences);
  };

  const toggleSkipPreview = () => {
    updatePreferences({ skip_preview: !preferences.skip_preview });
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    toggleSkipPreview,
    isUpdating: updatePreferencesMutation.isPending,
  };
};