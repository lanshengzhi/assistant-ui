## Architecture

```
@assistant-ui/tap          → Zero-dep reactive primitives (tapState, tapEffect, etc.)
@assistant-ui/store        → Bridges tap with React (useAui, useAuiState, AuiProvider)
@assistant-ui/core         → Shared primitives and types for React + React Native
@assistant-ui/react        → Web distribution (re-exports core + adds Radix primitives)
@assistant-ui/react-native → RN distribution (re-exports core + adds RN primitives)
@assistant-ui/react-ink    → Ink/terminal distribution
```

## Changesets

Every PR that changes a published package needs a changeset. Always use **patch** — minor/major require maintainer approval. Private packages (`@assistant-ui/docs`, `@assistant-ui/shadcn-registry`) are exempt.

```md
---
"@assistant-ui/react": patch
---

feat: description of the change
```

## Biome custom hooks

`useExhaustiveDependencies` tracks: `tapEffect`, `tapMemo`, `tapCallback`, `tapConst`, `tapResources`. `tapEffectEvent` returns a stable value.

## Package boundaries

`@assistant-ui/core` contains shared code. It has a `./react` sub-path that both `@assistant-ui/react` and `@assistant-ui/react-native` re-export from. Customers never install core directly — they use one of the three distribution packages (react, react-native, react-ink).

`@assistant-ui/ui` contains shadcn-style components that get copied into user projects. We use them directly in the monorepo to avoid duplication.

There is an ongoing migration from the legacy runtime architecture to a tap-only architecture.

## Git Workflow (Fork-based)

This repo is a fork of `assistant-ui`. Follow these rules to keep history clean and avoid polluting upstream:

- **Do NOT commit to `main`** — `main` is reserved for syncing with upstream only. Keep it clean.
- **Do NOT open Pull Requests to upstream** — All work stays in this fork.
- **Do all work on `feat/collaborative-space`** — This is the permanent feature branch for the collaborative space work. Commit directly to it.
- **Commit & push to fork** — When the user says "commit", "push", or "save changes":
  1. Commit to `feat/collaborative-space`
  2. Push to the fork remote (`origin`)
  3. Do NOT merge into `main`
- **No PR creation** — Unless explicitly asked by the user, do not create pull requests (either to upstream or within the fork).

## Quality Checks

Before marking any task as complete or committing changes that touch behavior-bearing code, run all three checks:

```bash
# 1. Tests
cd packages/core && node_modules/.bin/vitest run

# 2. Lint
npx biome check packages/core/src/path/to/changed/files

# 3. TypeScript compilation
cd packages/core && npx tsc --noEmit
```

**Important:** `tsc --noEmit` catches type errors that Vitest (which uses esbuild for transpilation) does not. Do not skip this step.
