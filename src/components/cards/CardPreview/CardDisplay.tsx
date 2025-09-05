import { 
  AspectRatio, 
  Grid, 
  GridItem, 
  VStack, 
  Text, 
  Image, 
  Box,
  Spinner,
  Center
} from '@chakra-ui/react';
import { ICardContent } from '@/types/cards';

interface CardDisplayProps {
  content: ICardContent;
  isLoading?: boolean;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({ content, isLoading = false }) => {
  if (isLoading) {
    return (
      <AspectRatio ratio={3/4}>
        <Center>
          <Spinner size="xl" />
        </Center>
      </AspectRatio>
    );
  }

  return (
    <AspectRatio ratio={3/4}>
      <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">
        <Grid 
          templateColumns="1fr 1fr" 
          templateRows="1fr 1fr" 
          height="100%"
          gap={1}
        >
          {content.scenes.map((scene, index) => (
            <GridItem key={scene.id} position="relative">
              <Image
                src={scene.image_url}
                alt={scene.description}
                width="100%"
                height="100%"
                objectFit="cover"
                fallback={
                  <Center height="100%" bg="gray.100">
                    <Spinner />
                  </Center>
                }
              />
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg="blackAlpha.700"
                px={2}
                py={1}
              >
                <Text color="white" fontSize="sm" textAlign="center" noOfLines={2}>
                  {scene.description}
                </Text>
              </Box>
            </GridItem>
          ))}
        </Grid>
        
        {/* Primary word overlay */}
        <Box
          position="absolute"
          top={2}
          left={2}
          right={2}
          textAlign="center"
        >
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="white"
            textShadow="2px 2px 4px rgba(0,0,0,0.8)"
            bg="blackAlpha.600"
            px={4}
            py={2}
            borderRadius="md"
          >
            {content.primary_word.toUpperCase()}
          </Text>
        </Box>
      </Box>
    </AspectRatio>
  );
};