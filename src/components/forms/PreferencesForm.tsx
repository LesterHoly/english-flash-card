import {
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Text,
  Box,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Skeleton
} from '@chakra-ui/react';
import { FiZap, FiEye } from 'react-icons/fi';
import { usePreferences } from '@/hooks/usePreferences';

export const PreferencesForm: React.FC = () => {
  const { preferences, isLoading, toggleSkipPreview, isUpdating } = usePreferences();

  if (isLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Skeleton height="60px" />
        <Skeleton height="120px" />
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Card Generation Preferences
        </Text>

        <FormControl>
          <HStack spacing={3} align="start">
            <Switch
              id="skip-preview"
              isChecked={preferences.skip_preview}
              onChange={toggleSkipPreview}
              isDisabled={isUpdating}
              colorScheme="blue"
            />
            <VStack align="start" spacing={2} flex={1}>
              <FormLabel htmlFor="skip-preview" mb={0} cursor="pointer">
                <HStack spacing={2}>
                  <Icon as={FiZap} color="blue.500" />
                  <Text fontWeight="medium">Skip Preview Modal</Text>
                </HStack>
              </FormLabel>
              <Text fontSize="sm" color="gray.600">
                When enabled, cards will download immediately after generation without showing the preview modal.
              </Text>
            </VStack>
          </HStack>
        </FormControl>
      </Box>

      <Alert status="info" variant="left-accent">
        <AlertIcon />
        <Box>
          <AlertTitle>Workflow Differences</AlertTitle>
          <AlertDescription>
            <VStack align="start" spacing={2} mt={2}>
              <HStack spacing={2}>
                <Icon as={FiEye} />
                <Text fontSize="sm">
                  <strong>With Preview:</strong> Generate → Preview Modal → Approve & Download
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FiZap} />
                <Text fontSize="sm">
                  <strong>Skip Preview:</strong> Generate → Auto-Download (faster workflow)
                </Text>
              </HStack>
            </VStack>
          </AlertDescription>
        </Box>
      </Alert>

      <Alert status="success" variant="subtle">
        <AlertIcon />
        <Box>
          <Text fontSize="sm">
            You can still manually preview any card from your library, even with skip preview enabled.
          </Text>
        </Box>
      </Alert>
    </VStack>
  );
};