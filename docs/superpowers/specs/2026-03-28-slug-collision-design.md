# Slug Collision Handling Design

**Goal**

Add collision-resistant slug generation for all collections that use the shared slug field builder, without backfilling existing records. The new behavior only applies to future creates and rename-style updates.

**Scope**

- Main repository only.
- Shared slug generation used by `posts`, `schools`, `school-sub-channels`, and `tags`.
- No schema changes and no data migration for existing documents.

**Behavior**

- Continue normal slug formatting: trim, lowercase, strict slugify, transliterate when needed.
- When a generated or manually provided slug is already taken by another document in the same collection, automatically try numeric suffixes in order: `slug-2`, `slug-3`, and so on.
- When updating an existing document, its own current slug must not count as a collision.
- Existing database unique indexes remain in place as the final safeguard.

**Implementation Approach**

- Keep Payload's `slugField` as the base UI and autosave behavior.
- Extend the shared `buildSlugField` helper with a slug text-field hook that runs after slug value generation and normalizes the final value to a unique slug.
- Move slug formatting into focused helper functions so formatting and de-duplication can be tested independently.
- Use the Local API from the hook with `req` passed through for hook safety and an intentional access override so uniqueness checks see all documents in the collection.

**Testing**

- Add integration-style Vitest coverage for the shared slug helper behavior through Payload:
  - creating two posts with the same title yields `slug` and `slug-2`
  - updating the same document without changing the effective slug does not rename it
  - renaming another document into an occupied slug produces the next numeric suffix
- Run the targeted test file first as a failing test, then re-run after implementation.
- Run `tsc --noEmit` before completion.

**Out of Scope**

- Rewriting historical slugs
- Changing frontend routes
- Adding retry-on-unique-constraint handling for simultaneous writes beyond the current unique-index safeguard
