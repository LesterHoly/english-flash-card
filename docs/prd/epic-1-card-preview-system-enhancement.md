# Epic 1: Card Preview System Enhancement

**Epic Goal**: Enable users to preview and validate generated flashcards before download through an integrated modal interface that maintains the fast generation workflow while reducing regeneration waste and improving content confidence.

**Integration Requirements**: Preview system must integrate seamlessly with existing Next.js generation pipeline, Chakra UI design system, and Supabase user preferences without modifying core generation APIs or disrupting the established user workflow for parents and educators.

## Story 1.1: Card Preview Modal Component

As a **parent or educator**,
I want **to see a preview of my generated flashcard in the proper 3:4 format before downloading**,
so that **I can verify the content quality and visual layout meets my expectations before printing or using with children**.

### Acceptance Criteria

1. Preview modal displays generated card content maintaining exact 3:4 aspect ratio with proper scaling
2. Modal uses existing Chakra UI components and follows established design system patterns
3. Card preview shows both image and text elements clearly readable at modal size
4. Modal includes loading state during card generation with existing spinner components
5. Preview automatically opens after successful card generation completion

### Integration Verification

- IV1: Existing card generation workflow continues to function without preview modal when feature is disabled
- IV2: Modal component integrates with current Chakra UI theme and responsive breakpoints
- IV3: Preview display performance does not impact generation API response times

## Story 1.2: Preview Action Controls

As a **user reviewing a generated card**,
I want **clear action buttons to either download the card or generate a new version**,
so that **I can efficiently proceed with my desired next step without confusion or extra navigation**.

### Acceptance Criteria

1. Download button follows primary button styling and initiates existing download workflow
2. Regenerate button follows secondary button styling and restarts generation process
3. Close/cancel option allows dismissing preview without action
4. Button states provide visual feedback during download or regeneration processing
5. Actions integrate with existing card library and user account systems

### Integration Verification

- IV1: Download functionality maintains existing file naming and format standards
- IV2: Regeneration preserves original input parameters and user context
- IV3: Modal actions integrate with current state management without conflicts

## Story 1.3: Preview Settings and Workflow Integration  

As a **frequent user who prefers quick generation**,
I want **the ability to skip card preview and go directly to download**,
so that **I can maintain my efficient workflow while still having preview available when needed**.

### Acceptance Criteria

1. Settings page includes "Skip Preview" toggle with clear explanation
2. When enabled, cards download immediately after generation without modal
3. Setting persists across user sessions through existing preference system
4. Users can re-enable preview functionality at any time through settings
5. Default behavior shows preview for new users with option to disable

### Integration Verification

- IV1: Settings integration uses existing user preference storage and retrieval patterns
- IV2: Workflow branching logic maintains existing generation performance characteristics
- IV3: Settings changes take effect immediately without requiring page refresh or re-login