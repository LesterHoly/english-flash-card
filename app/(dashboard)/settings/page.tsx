'use client';

import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  Divider
} from '@chakra-ui/react';
import { PreferencesForm } from '@/components/forms/PreferencesForm';

export default function SettingsPage() {
  return (
    <Container maxW="2xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Settings</Heading>
          <Text color="gray.600">
            Customize your flash card generation experience
          </Text>
        </Box>

        <Divider />

        <PreferencesForm />
      </VStack>
    </Container>
  );
}