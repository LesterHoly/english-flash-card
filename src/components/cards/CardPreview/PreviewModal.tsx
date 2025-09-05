import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  useToast
} from '@chakra-ui/react';
import { useState } from 'react';
import { CardDisplay } from './CardDisplay';
import { CardPreviewProps } from './types';
import { usePreview } from '@/hooks/usePreview';

export const PreviewModal: React.FC<CardPreviewProps> = ({
  card,
  isOpen,
  onClose,
  onApprove,
  onRegenerate
}) => {
  const { isDownloading, isRegenerating } = usePreview();
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();
  
  const isLoading = card.status === 'generating';
  const isAnyActionLoading = isDownloading || isRegenerating || isProcessing;

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await onApprove(card.id);
      
      toast({
        title: 'Card Approved!',
        description: 'Your card has been approved and downloaded.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve and download card. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsProcessing(true);
      await onRegenerate(card.id);
      
      toast({
        title: 'Regenerating Card',
        description: 'Creating a new version of your card...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Regeneration Failed',
        description: 'Failed to regenerate card. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold">
              Card Preview
            </Text>
            <Text fontSize="sm" color="gray.600">
              {card.title}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isAnyActionLoading} />
        
        <ModalBody>
          <VStack spacing={4}>
            <CardDisplay content={card.content} isLoading={isLoading} />
            
            {!isLoading && (
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Preview shows how your flashcard will look when printed in 3:4 format
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} justify="center">
            <Button 
              variant="ghost" 
              onClick={onClose}
              isDisabled={isAnyActionLoading}
            >
              Close
            </Button>
            
            {!isLoading && (
              <>
                <Button 
                  colorScheme="orange" 
                  variant="outline"
                  onClick={handleRegenerate}
                  isLoading={isRegenerating || isProcessing}
                  loadingText="Regenerating..."
                  isDisabled={isAnyActionLoading}
                >
                  Regenerate
                </Button>
                <Button 
                  colorScheme="green"
                  onClick={handleApprove}
                  isLoading={isDownloading || isProcessing}
                  loadingText="Downloading..."
                  isDisabled={isAnyActionLoading}
                >
                  Approve & Download
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};