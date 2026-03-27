# Slug Collision Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all shared Payload slug generation automatically avoid collisions for future creates and rename updates.

**Architecture:** Keep using Payload's built-in `slugField` for authoring behavior, then add a shared hook on the slug text field that normalizes and de-duplicates the final slug value with collection-aware lookups. Centralize formatting and uniqueness helpers in the shared slug field module so all four collections inherit the same behavior.

**Tech Stack:** Payload CMS 3, TypeScript, Vitest, D1-backed Local API

---

### Task 1: Add failing collision tests

**Files:**
- Create: `tests/int/slug.int.spec.ts`
- Modify: `vitest.config.mts`

- [ ] **Step 1: Write the failing test**

Add a new integration spec that creates duplicate posts and expects the second slug to become `-2`, then covers update behavior for self-preservation and rename collisions.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/slug.int.spec.ts`
Expected: FAIL because duplicate slugs currently hit the existing uniqueness behavior instead of being auto-adjusted.

### Task 2: Implement shared unique slug generation

**Files:**
- Modify: `src/fields/slug.ts`

- [ ] **Step 1: Add focused helpers**

Extract pure slug formatting into helpers and add an async helper that checks the current collection for existing slug conflicts while excluding the current document.

- [ ] **Step 2: Attach the uniqueness hook**

Use `slugField({ overrides })` to add a slug text-field hook that rewrites the final slug to the first available numeric suffix.

- [ ] **Step 3: Run targeted test to verify it passes**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/slug.int.spec.ts`
Expected: PASS

### Task 3: Final verification

**Files:**
- Modify: `docs/superpowers/specs/2026-03-28-slug-collision-design.md`
- Modify: `docs/superpowers/plans/2026-03-28-slug-collision-handling.md`

- [ ] **Step 1: Run TypeScript verification**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Review docs and implementation**

Confirm the shipped behavior still matches the approved scope: future creates and rename updates only, no backfill, no schema migration.
