# CampusBlog Homepage Discovery Redesign

Date: 2026-03-27
Scope: `src/app/(frontend)/page.tsx` and homepage-facing frontend UI only
Status: Approved in conversation, pending written-spec review

## 1. Summary

This redesign updates the CampusBlog homepage to prioritize content discovery while keeping a young campus feel. The chosen direction is the previously reviewed "C. Dual-Layer Discovery" approach:

- discovery-first rather than channel-first
- youthful and energetic rather than childish
- content-rich without losing hierarchy
- highly compatible with the existing Next.js + Payload frontend structure
- built by reusing the current component library wherever possible

The homepage will evolve from a simple "sticky search + direct feed" layout into a structured discovery surface:

1. lightweight homepage hero
2. discovery mode tabs
3. primary post stream
4. secondary school/channel/tag metadata rail

This is a presentation-layer redesign only. It does not require changes to Payload collections, routes, authentication, or CMS schema.

## 2. Goals

### Primary goals

- Make homepage browsing feel like entering a campus content community, not a generic blog.
- Make high-value content easier to discover from the first screen.
- Preserve the current school- and channel-based information architecture, but reduce its visual dominance on the homepage.
- Reuse as much of the current UI/component system as possible.
- Ensure all new homepage copy is fully integrated with existing i18n flow.

### Secondary goals

- Improve first-impression brand quality.
- Reduce visual heaviness from the current sidebar and glass-heavy composition.
- Create a homepage structure that can later support recommendation logic without redesigning the UI again.

## 3. Non-Goals

- No changes to Payload collections or field schema.
- No new homepage-specific backend data model.
- No route structure changes.
- No recommendation algorithm implementation in this phase.
- No redesign of school pages, post pages, or editor flows in this spec.

## 4. Existing Constraints

### Architecture constraints

- The app uses the existing frontend route at `src/app/(frontend)/page.tsx`.
- Frontend layout, locale resolution, and dictionary loading already exist in `src/app/(frontend)/layout.tsx`.
- Current school navigation is driven through `FrontendChrome` and `SidebarNav`.
- Post rendering already relies on `PostFeed` and `PostCard`.

### Product constraints

- The product is a campus community/content platform, not a generic media site.
- School and channel structure still matters and must remain visible.
- Content discovery is now the homepage's top priority.

### Engineering constraints

- Reuse current components before creating new ones.
- Keep changes local to homepage-facing UI where possible.
- All new user-facing copy must be stored in locale JSON files.

## 5. Design Direction

### Chosen direction

The homepage will use a hybrid of:

- Bento-style modular layout for clean segmentation and youthful energy
- light editorial hierarchy for stronger content framing

This creates a homepage that feels current and campus-oriented while remaining readable for content-heavy use.

### Desired tone

- young
- clean
- social
- editorial-lite
- optimistic
- readable

### Tone to avoid

- childish
- toy-like
- over-glassy
- overly corporate
- generic startup dashboard

## 6. Visual System

### Color direction

The existing `design-system/campusblog/MASTER.md` direction is too close to children's education/newsletter styling and should not drive this homepage redesign.

The homepage should use a fresher campus palette:

- Primary: `#2F6DF6`
- Secondary: `#27B27E`
- Accent: `#FF9E4A`
- Background: `#F6F7FB`
- Text: `#132238`

Usage intent:

- blue anchors brand identity and core navigation emphasis
- green supports freshness, discovery, and positive UI accents
- orange is reserved for CTA moments, highlights, or high-attention badges
- background remains light and breathable to support long browsing sessions

### Typography direction

Do not replace the current multilingual font setup in `src/app/(frontend)/layout.tsx`.

Instead, refine usage:

- `Noto Serif SC` for hero headlines and select featured titles
- `Noto Sans SC` for body reading and general UI content
- `Manrope` for labels, tabs, buttons, metadata, and compact utility text

This preserves localization quality for Chinese and English while still introducing stronger editorial hierarchy.

### Surface and motion

- large rounded cards remain part of the system
- soft shadows remain, but are lighter and less glossy
- glass effects should be reduced and used only where they improve layering
- hover motion should be subtle and stable
- major interaction transitions should stay in the 150-250ms range

## 7. Homepage Information Architecture

The homepage will be reorganized into the following order:

1. lightweight hero with topical or brand-forward message
2. global search as the strongest utility action
3. discovery mode tabs
4. main post stream
5. secondary metadata rail for school/channel/tag shortcuts

### Why this structure

- It keeps discovery central.
- It avoids making school selection the first task.
- It preserves campus context without letting navigation overwhelm content.
- It maps well to current components and route boundaries.

## 8. Homepage Sections

### 8.1 Hero

The hero should be lighter than a traditional marketing hero.

Responsibilities:

- establish campus energy
- frame the homepage as a living community space
- introduce the day's browsing context

Requirements:

- visually compact
- no large CTA block that overwhelms discovery
- compatible with both authenticated and unauthenticated users
- fully localized copy

### 8.2 Search

Search remains one of the homepage's strongest interactions.

Requirements:

- continue reusing `SearchBar`
- move search into a more intentional first-screen composition
- keep keyboard usability intact
- localize placeholder and any new helper text

### 8.3 Discovery mode tabs

A new discovery layer should be introduced directly under the hero/search area.

Initial tab set:

- Recommended
- Latest
- Same School Trending
- Nearby Schools

Phase-1 behavior:

- UI-first presentation layer
- simple client-side switching or display-layer switching
- no requirement for production recommendation logic yet

Design intent:

- communicate that the homepage is not one undifferentiated feed
- make discovery feel active and navigable

### 8.4 Main feed

The main post stream remains the core homepage content area.

Requirements:

- continue using `PostFeed` and `PostCard`
- preserve masonry-like energy, but improve first-screen rhythm
- add hierarchy so a small number of cards can feel more featured when needed
- keep loading/layout behavior stable to avoid jumping

### 8.5 Metadata rail

The homepage should still expose school and channel structure, but as a secondary layer.

This rail may contain:

- school switcher or school highlights
- quick links into channels
- tag clusters or trending topics

Behavior:

- desktop: visible as supporting context near the feed
- mobile: moved below primary content or condensed into smaller modules

## 9. Component Reuse Strategy

### Reuse without replacement

These components should be preserved and adapted:

- `src/app/(frontend)/page.tsx`
- `src/app/(frontend)/components/layout/SearchBar.tsx`
- `src/app/(frontend)/components/PostFeed.tsx`
- `src/app/(frontend)/components/PostCard.tsx`
- `src/app/(frontend)/components/layout/SidebarNav.tsx`

### Light adaptation

Expected changes:

- `page.tsx` becomes a composition layer for homepage sections
- `SearchBar` gets homepage-specific placement and sizing adjustments
- `PostFeed` may accept light homepage-specific display props
- `PostCard` may gain a modest variant/priority concept if needed for featured rhythm
- `SidebarNav` keeps structure but visually steps back

### New small components allowed

Small homepage-focused presentational components are allowed if they stay narrowly scoped:

- `DiscoverHero`
- `DiscoverTabs`
- `DiscoverMetaRail` or `DiscoverHighlights`

These components should remain shallow composition components, not new generic design-system primitives.

## 10. i18n Requirements

This redesign must treat i18n as a hard requirement.

### Rules

- No newly added homepage UI copy may be hardcoded in React components.
- All new strings must be added to both:
  - `src/app/(frontend)/locales/zh-CN.json`
  - `src/app/(frontend)/locales/en-US.json`
- The homepage must continue using the existing dictionary loading flow.

### Expected homepage copy categories

- hero title
- hero subtitle
- discovery tab labels
- metadata rail headings
- empty-state copy for homepage filters
- any new helper or hint text

### Empty state distinction

The homepage must distinguish between:

- there are no posts in the system
- there are no posts for the current discovery view/filter

Both states must have localized copy.

## 11. Interaction Design

### Motion

- tab switches should feel responsive but restrained
- no large or bouncy transitions
- use opacity/position changes only where they do not disrupt browsing

### States

The homepage needs explicit handling for:

- default feed state
- alternate tab state
- no-content state
- loading or delayed data state if introduced later

### Accessibility

- search remains keyboard accessible
- tab order should match visible hierarchy
- state should never be expressed by color alone
- focus styling must remain visible

## 12. Responsive Behavior

### Mobile

Priority order on mobile:

1. compact hero
2. search
3. discovery tabs
4. post stream
5. school/channel/tags support blocks

### Desktop

Priority order on desktop:

1. sidebar navigation
2. homepage discovery composition
3. metadata/support rail

### Breakpoint expectations

The redesign must remain usable at minimum:

- 375px
- 768px
- 1024px

## 13. Data and Backend Assumptions

This spec assumes the homepage can continue to source published post data from current CMS helpers.

Implementation may use current fetch paths first and stage discovery tabs as presentation modes before richer logic exists.

This means:

- no immediate backend contract change is required
- recommendation-style labels can exist before recommendation logic exists
- deeper feed intelligence can be layered in later

## 14. Risks and Mitigations

### Risk: homepage becomes visually busy

Mitigation:

- keep hero compact
- cap the number of first-screen supporting modules
- visually demote metadata rail

### Risk: discovery tabs feel fake without real differentiated data

Mitigation:

- treat tabs as clear UI scaffolding
- keep the first implementation honest and simple
- avoid overpromising personalization in copy

### Risk: sidebar still dominates the page

Mitigation:

- lower contrast and visual weight in sidebar treatment
- make homepage main surface brighter and more focused

### Risk: localization gets missed during UI iteration

Mitigation:

- treat locale-file updates as part of homepage completion criteria
- reject any implementation with hardcoded homepage copy

## 15. Acceptance Criteria

- The homepage clearly feels like a campus content community.
- The first screen prioritizes discovering content over choosing channels.
- School and channel structure remains available but secondary.
- The redesign reuses the current component system rather than replacing it.
- All newly introduced homepage copy is integrated into existing i18n files.
- No Payload schema, route, or authentication architecture changes are required.
- The homepage works acceptably on 375px, 768px, and 1024px layouts.

## 16. Implementation Notes For Planning

When this design moves into implementation planning, the work should likely be organized into:

1. homepage composition refactor
2. homepage-specific presentational components
3. card/feed visual adaptation
4. sidebar visual weight reduction
5. locale-file additions and copy wiring
6. responsive polish and verification

## 17. Explicit Decisions

- The homepage redesign uses the approved "C. Dual-Layer Discovery" direction.
- i18n support is mandatory for all new homepage UI copy.
- Existing multilingual font setup stays in place.
- Existing component reuse is preferred over introducing new generic primitives.
- This phase is UI architecture and presentation redesign only, not recommendation-system work.
