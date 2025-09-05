# Requirements

## Functional

- FR1: The card preview system shall display generated card content in an overlay modal maintaining the 3:4 aspect ratio format
- FR2: The preview modal shall include download and regenerate action buttons integrated with existing generation workflow  
- FR3: Users shall be able to skip preview functionality through settings for quick generation workflow
- FR4: The preview system shall support both Single Word Cards and Category Cards display formats
- FR5: Preview loading states shall provide visual feedback during card generation processing

## Non Functional

- NFR1: Preview modal shall load generated content within 2 seconds of generation completion
- NFR2: Preview system shall not impact existing generation API performance or introduce additional OpenAI calls
- NFR3: Preview interface shall be fully responsive across desktop and tablet viewports using existing Chakra UI breakpoints
- NFR4: Preview modal shall follow existing accessibility standards implemented in the current Chakra UI component library

## Compatibility Requirements

- CR1: Existing card generation APIs shall remain unchanged, preview intercepts output without modifying generation pipeline
- CR2: Current user account and card library functionality shall remain fully compatible with preview-enabled cards
- CR3: Preview interface shall use existing Chakra UI design system and component patterns for visual consistency
- CR4: Preview feature shall integrate with current Next.js routing and state management without architectural changes
