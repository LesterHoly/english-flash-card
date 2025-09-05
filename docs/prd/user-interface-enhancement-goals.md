# User Interface Enhancement Goals

## Integration with Existing UI

The preview modal will integrate seamlessly with the current Chakra UI design system, using existing modal components, color schemes, and typography patterns. The preview will maintain the established visual hierarchy with the card content as the primary focus, action buttons following the existing button styling (primary for download, secondary for regenerate), and loading states using the current spinner and skeleton components already implemented in the generation workflow.

## Modified/New Screens and Views

- **Card Generation Flow**: Enhanced with preview modal overlay after generation completion
- **Preview Modal**: New modal component displaying generated card in 3:4 format with action buttons
- **Settings Page**: New toggle option for "Skip Preview" functionality

## UI Consistency Requirements

- Preview modal shall use existing Chakra UI Modal component with consistent backdrop and animation patterns
- Action buttons shall follow established primary/secondary button hierarchy (Download primary, Regenerate secondary)
- Loading states shall use existing Spinner and Skeleton components matching current generation feedback patterns
- Card display shall maintain the 3:4 aspect ratio with proper scaling and centering within modal viewport
- Typography and spacing shall follow existing design tokens for consistency with current interface
