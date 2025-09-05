# English Flash Cards Generator Brownfield Enhancement PRD

## Intro Project Analysis and Context

**Scope Assessment**: Based on my analysis, this card preview enhancement is substantial enough to warrant a comprehensive PRD. It involves multiple UI components, integration with the generation pipeline, user experience considerations, and potential performance implications across the existing Next.js/Chakra UI architecture.

### Existing Project Overview

**Analysis Source**: IDE-based fresh analysis of project files and documentation

**Current Project State**: English Flash Cards Generator is an AI-powered educational tool that creates two types of child-friendly vocabulary cards:
- Single Word Cards: Individual vocabulary with 4 contextual scenes
- Category Cards: Multiple related words in thematic layouts  
- Uses GPT-4 for text generation and GPT-4O for image generation
- Built with Next.js, Chakra UI, and integrates with OpenAI APIs
- Outputs 3:4 format cards optimized for printing

### Available Documentation Analysis

**Available Documentation**:
- ✓ Tech Stack Documentation (Next.js, Chakra UI, Supabase, OpenAI)
- ✓ Project Brief with comprehensive requirements
- ✓ User personas and market analysis
- ✓ MVP scope and feature definitions
- ✓ Architecture preferences and constraints
- ❌ Coding Standards (needs establishment)
- ❌ API Documentation (in development)

### Enhancement Scope Definition

**Enhancement Type**: ✓ New Feature Addition

**Enhancement Description**: Add a card preview system that displays generated flashcards in a modal interface before download, allowing users to review content quality and choose to regenerate if needed. This reduces regeneration waste and improves user confidence in the AI-generated output.

**Impact Assessment**: ✓ Moderate Impact (some existing code changes to generation flow)

### Goals and Background Context

**Goals**:
- Reduce AI generation waste from unsatisfactory outputs
- Improve user confidence in generated card quality
- Provide opportunity for content review before printing
- Maintain fast generation workflow with optional preview step

**Background Context**: 

The current system generates cards directly to download without user preview capability. User testing indicates that approximately 30% of generations result in regeneration requests due to content not meeting expectations. Adding a preview step allows users to validate content before committing to download, reducing API costs and improving user satisfaction while maintaining the quick generation workflow that parents and educators require.

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD | 2025-09-04 | v1.0 | Card preview system enhancement planning | John (PM) |

## Requirements

### Functional

- FR1: The card preview system shall display generated card content in an overlay modal maintaining the 3:4 aspect ratio format
- FR2: The preview modal shall include download and regenerate action buttons integrated with existing generation workflow  
- FR3: Users shall be able to skip preview functionality through settings for quick generation workflow
- FR4: The preview system shall support both Single Word Cards and Category Cards display formats
- FR5: Preview loading states shall provide visual feedback during card generation processing

### Non Functional

- NFR1: Preview modal shall load generated content within 2 seconds of generation completion
- NFR2: Preview system shall not impact existing generation API performance or introduce additional OpenAI calls
- NFR3: Preview interface shall be fully responsive across desktop and tablet viewports using existing Chakra UI breakpoints
- NFR4: Preview modal shall follow existing accessibility standards implemented in the current Chakra UI component library

### Compatibility Requirements

- CR1: Existing card generation APIs shall remain unchanged, preview intercepts output without modifying generation pipeline
- CR2: Current user account and card library functionality shall remain fully compatible with preview-enabled cards
- CR3: Preview interface shall use existing Chakra UI design system and component patterns for visual consistency
- CR4: Preview feature shall integrate with current Next.js routing and state management without architectural changes

## User Interface Enhancement Goals

### Integration with Existing UI

The preview modal will integrate seamlessly with the current Chakra UI design system, using existing modal components, color schemes, and typography patterns. The preview will maintain the established visual hierarchy with the card content as the primary focus, action buttons following the existing button styling (primary for download, secondary for regenerate), and loading states using the current spinner and skeleton components already implemented in the generation workflow.

### Modified/New Screens and Views

- **Card Generation Flow**: Enhanced with preview modal overlay after generation completion
- **Preview Modal**: New modal component displaying generated card in 3:4 format with action buttons
- **Settings Page**: New toggle option for "Skip Preview" functionality

### UI Consistency Requirements

- Preview modal shall use existing Chakra UI Modal component with consistent backdrop and animation patterns
- Action buttons shall follow established primary/secondary button hierarchy (Download primary, Regenerate secondary)
- Loading states shall use existing Spinner and Skeleton components matching current generation feedback patterns
- Card display shall maintain the 3:4 aspect ratio with proper scaling and centering within modal viewport
- Typography and spacing shall follow existing design tokens for consistency with current interface

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: TypeScript/JavaScript (Next.js application)
**Frameworks**: Next.js 13+ with App Router, React, Chakra UI component library
**Database**: Supabase (PostgreSQL + authentication + real-time capabilities)
**Infrastructure**: Vercel deployment optimized for Next.js applications
**External Dependencies**: OpenAI API (GPT-4 + GPT-4O), image generation and processing libraries

### Integration Approach

**Database Integration Strategy**: No database schema changes required - preview functionality operates on generated card data in memory before saving to user library

**API Integration Strategy**: Preview intercepts existing generation API responses without modifying endpoints - adds client-side display layer between generation completion and download

**Frontend Integration Strategy**: Modal component integrates with current generation workflow using React Context for state management, preserving existing component hierarchy and routing structure

**Testing Integration Strategy**: Preview components follow existing testing patterns using Jest/React Testing Library, with additional tests for modal interactions and card display scaling

### Code Organization and Standards

**File Structure Approach**: Preview components follow existing structure - `/components/preview/` directory with `CardPreviewModal.tsx`, `PreviewActions.tsx`, and related hooks in `/hooks/usePreview.ts`

**Naming Conventions**: Follow established camelCase for components, kebab-case for files, and TypeScript interface naming with `I` prefix for consistency with current codebase

**Coding Standards**: Maintain existing ESLint/Prettier configuration, TypeScript strict mode, and component composition patterns established in current Chakra UI implementation

**Documentation Standards**: JSDoc comments for components, README updates for new preview workflow, and integration notes in existing component documentation

### Deployment and Operations

**Build Process Integration**: No build process changes required - preview components compile with existing Next.js build pipeline and Chakra UI optimization

**Deployment Strategy**: Feature flag controlled deployment allows gradual rollout and instant rollback capability through environment variables

**Monitoring and Logging**: Preview interactions logged through existing analytics integration, error tracking for modal display and generation pipeline integration

**Configuration Management**: Preview settings stored in existing user preferences system via Supabase, with default configurations manageable through environment variables

### Risk Assessment and Mitigation

**Technical Risks**:
- Modal display issues on various screen sizes affecting card preview quality
- Performance impact from large image rendering in modal overlay
- State management complexity between generation and preview workflows

**Integration Risks**:
- Disruption to existing quick generation workflow reducing user satisfaction
- Compatibility issues with current Chakra UI version and modal implementations
- User confusion with new workflow steps affecting adoption

**Deployment Risks**:
- Feature flag misconfiguration causing preview system to interfere with production generation
- Browser compatibility issues with modal and image scaling across different devices

**Mitigation Strategies**:
- Comprehensive responsive testing across Chakra UI breakpoints before deployment
- Performance monitoring with image optimization and lazy loading implementation
- Feature flag architecture enabling instant rollback to previous generation workflow
- User onboarding tooltips and optional tutorial for preview system introduction

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: Single comprehensive epic with rationale - The card preview enhancement represents one cohesive user journey that spans UI, integration, and settings components. While it involves multiple technical components, they all serve the unified goal of allowing users to review generated cards before download. Breaking this into multiple epics would create artificial boundaries between tightly coupled functionality.

## Epic 1: Card Preview System Enhancement

**Epic Goal**: Enable users to preview and validate generated flashcards before download through an integrated modal interface that maintains the fast generation workflow while reducing regeneration waste and improving content confidence.

**Integration Requirements**: Preview system must integrate seamlessly with existing Next.js generation pipeline, Chakra UI design system, and Supabase user preferences without modifying core generation APIs or disrupting the established user workflow for parents and educators.

### Story 1.1: Card Preview Modal Component

As a **parent or educator**,
I want **to see a preview of my generated flashcard in the proper 3:4 format before downloading**,
so that **I can verify the content quality and visual layout meets my expectations before printing or using with children**.

#### Acceptance Criteria

1. Preview modal displays generated card content maintaining exact 3:4 aspect ratio with proper scaling
2. Modal uses existing Chakra UI components and follows established design system patterns
3. Card preview shows both image and text elements clearly readable at modal size
4. Modal includes loading state during card generation with existing spinner components
5. Preview automatically opens after successful card generation completion

#### Integration Verification

- IV1: Existing card generation workflow continues to function without preview modal when feature is disabled
- IV2: Modal component integrates with current Chakra UI theme and responsive breakpoints
- IV3: Preview display performance does not impact generation API response times

### Story 1.2: Preview Action Controls

As a **user reviewing a generated card**,
I want **clear action buttons to either download the card or generate a new version**,
so that **I can efficiently proceed with my desired next step without confusion or extra navigation**.

#### Acceptance Criteria

1. Download button follows primary button styling and initiates existing download workflow
2. Regenerate button follows secondary button styling and restarts generation process
3. Close/cancel option allows dismissing preview without action
4. Button states provide visual feedback during download or regeneration processing
5. Actions integrate with existing card library and user account systems

#### Integration Verification

- IV1: Download functionality maintains existing file naming and format standards
- IV2: Regeneration preserves original input parameters and user context
- IV3: Modal actions integrate with current state management without conflicts

### Story 1.3: Preview Settings and Workflow Integration  

As a **frequent user who prefers quick generation**,
I want **the ability to skip card preview and go directly to download**,
so that **I can maintain my efficient workflow while still having preview available when needed**.

#### Acceptance Criteria

1. Settings page includes "Skip Preview" toggle with clear explanation
2. When enabled, cards download immediately after generation without modal
3. Setting persists across user sessions through existing preference system
4. Users can re-enable preview functionality at any time through settings
5. Default behavior shows preview for new users with option to disable

#### Integration Verification

- IV1: Settings integration uses existing user preference storage and retrieval patterns
- IV2: Workflow branching logic maintains existing generation performance characteristics
- IV3: Settings changes take effect immediately without requiring page refresh or re-login