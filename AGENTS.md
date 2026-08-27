# AGENTS.md

This file provides guidance to coding agents (Claude Code and others) when working in this repository. Each app carries its own guide with the details that only apply there:

- [`apps/web/AGENTS.md`](apps/web/AGENTS.md) — routes, data fetching, preview, forms
- [`apps/studio/AGENTS.md`](apps/studio/AGENTS.md) — schemas, desk structure, presentation tool

## Project Overview

TSG Irlich website - a Next.js application with Sanity CMS for a German sports club. This is a monorepo built with Turbo containing:

- **apps/web**: Next.js 16 frontend with App Router, TypeScript, Tailwind CSS, Shadcn UI
- **apps/studio**: Sanity Studio CMS for content management
- **packages/email**: React Email templates for transactional emails
- **packages/shared**: Shared utilities and types

## Development Commands

Run these from the repository root; they fan out to the workspaces through Turbo. The per-app commands are listed in the app's own `AGENTS.md`.

```bash
# Development
pnpm run dev                         # Start all apps in development mode
pnpm run dev:email                   # Start React Email preview server

# Building
pnpm run build                       # Build all apps
pnpm run build:affected              # Build only affected packages

# Linting & Formatting
pnpm run lint                        # Lint all apps plus the root files
pnpm run lint:fix                    # Lint and autofix
pnpm run lint:affected               # Lint only affected packages
pnpm run lint:root                   # Lint root directory files
pnpm run format                      # Format with oxfmt (format:check to only verify)

# Testing
pnpm run test                        # Run every unit test suite
pnpm run test:affected               # Only the affected packages
pnpm run test:coverage               # Run with coverage (lcov per workspace)

# Type Checking & Generation
pnpm run typecheck                   # Type check all apps
pnpm run extract-types               # Extract the Sanity schema from the studio
pnpm run typegen:sanity              # Generate Sanity types for web app
pnpm run typegen:routes              # Generate Next.js route types

# Security
pnpm run cve                         # Audit the dependencies with cve-lite
```

## Architecture & Code Organization

### Monorepo Structure

- Built with **Turbo** for build orchestration and caching
- **pnpm** as package manager with workspace support
- Shared dependencies managed with explicit pinned versions
- Node.js ^24.19.0 and pnpm 11.22.0 required

### Web App (Next.js)

- **App Router** architecture with server components as default
- **Minimal 'use client'** usage - prefer server-side rendering
- **Tailwind CSS** with utility-first approach
- **Shadcn UI** components following CVA (Class Variance Authority) patterns, built on **Base UI** primitives
- **Sanity** as headless CMS with GROQ queries

### Component Architecture

- **Micro folder structure** - components broken into small, focused parts
- **Function declarations** (not const) for React components
- **Named exports** preferred over default exports
- **TypeScript interfaces** at file end
- Components in `src/components/ui/` follow Shadcn patterns and wrap `@base-ui/react` primitives
- Composition uses Base UI's `render` prop, never Radix's `asChild`: `<Button render={<Link href="/x" />}>` replaces `<Button asChild><Link href="/x">`. For a component of your own, implement it with `useRender` from `@base-ui/react/use-render` — it is server-safe, so the wrapper stays a server component
- Base UI's `Button`, `Dialog.Close` and `Select.Trigger` enforce button semantics on whatever they render as, so a link must never go through them. `ButtonLink` (`src/components/ui/button/button-link.tsx`) styles the anchor itself instead
- State lives in bare data attributes (`data-open`, `data-checked`, `data-pressed`, `data-highlighted`), not in Radix's `data-state="…"`. Enter and exit animations use `transition-*` with `data-starting-style:` and `data-ending-style:` — `tailwindcss-animate` is no longer installed
- `components.json` names the `base-lyra` style, so `shadcn add` delivers Base UI components rather than Radix ones (`shadcn info` reports `base: base`). It still delivers _that style's_ classes, not this app's, so a fetched component is a starting point to replay onto the existing wrapper, never a drop-in overwrite

### Sanity CMS Integration

- **Content types**: Groups (sports departments), News, People, Testimonials
- **GROQ queries** in `src/lib/sanity/queries/`
- **Type generation** from Sanity schema to TypeScript
- **Image optimization** with next/image and Sanity image URLs
- **Preview**: the news routes are previewable through draft mode and the studio's presentation tool — see the two app guides before touching that wiring

## File & Naming Conventions

### Files & Directories

- **kebab-case** for all file and directory names
- `.tsx` for React components, `.ts` for utilities
- `.module.css` for CSS modules (used alongside Tailwind)

### Code Conventions

- **camelCase** for variables, functions, methods
- **PascalCase** for classes, types, interfaces, React components
- **CONSTANT_CASE** for constants and enum values
- **Descriptive names** with auxiliary verbs (isLoading, hasError, canDelete)

## Sanity Development Rules

### Schema Structure

- Always use `defineField()` for every field and `defineType()` for types
- Import `defineField`, `defineType`, `defineArrayMember` from 'sanity'
- Include icons from `react-icons/ri` or `@sanity/icons`
- German titles and descriptions for content editors
- Follow the established schema folder structure

### GROQ Queries

- Import `defineQuery` from 'next-sanity' and export every query as a constant
- camelCase naming with "Query" suffix
- **Do not expand images** in GROQ unless explicitly needed
- Reusable fragments are plain `/* groq */` template strings in `apps/web/src/lib/sanity/queries/index.ts` and get interpolated into the queries

### Type Generation Workflow

```bash
# After schema changes, always run from root:
pnpm run extract-types && pnpm run typegen:sanity
```

## Environment & Configuration

### Required Environment Variables

**Studio (.env)**:

- `SANITY_API_DATASET`
- `SANITY_API_PROJECT_ID`
- `SANITY_API_READ_TOKEN`
- `SANITY_API_VERSION`
- `SANITY_API_WRITE_TOKEN`
- `SANITY_STUDIO_PREVIEW_URL` (website shown in the presentation tool, defaults to `http://localhost:3000`)

**Web (.env.local)**:

- `LINEAR_API_KEY`,
- `LINEAR_TEAM_ID`,
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_STUDIO_URL`
- `RESEND_API_KEY`,
- `SANITY_API_READ_TOKEN`
- `SANITY_REVALIDATE_SECRET`
- `VERCEL_OIDC_TOKEN`
- `VERCEL_PROJECT_PRODUCTION_URL`

A new variable also has to be registered in the root `turbo.json` (`globalEnv` or the matching task), otherwise Turbo hides it from the build.

### Code Quality Tools

- **oxlint** with @mheob/oxlint-config (plus oxlint-tsgolint for type-aware rules)
- **oxfmt** with @mheob/oxfmt-config
- **Lefthook** for pre-commit hooks
- **Commitizen** with czg for conventional commits
- **Vitest** for unit tests, one `vitest.config.ts` per workspace (`apps/web`, `apps/studio`, `packages/shared`, `packages/email`); tests live next to their source (`foo.ts` → `foo.test.ts`)
- Import `describe`/`it`/`expect`/`vi` explicitly from `vitest` — `globals` stays off
- `apps/web` splits into a `node` and a `dom` (jsdom) project; component and hook tests land in `dom` — see `apps/web/AGENTS.md`
- `packages/email` runs entirely in the `node` environment and renders every component with `render()` from `react-email` to a plain HTML string — no `@testing-library/react`, no DOM. The newsletter template carries exactly two snapshots (the plain mailing and the CleverReach template), deliberately kept to that count since a full-document snapshot churns on any markup change; the suite freezes the clock with `vi.useFakeTimers()`/`vi.setSystemTime(...)` to a mid-year date before snapshotting, so the footer's `new Date().getFullYear()` doesn't drift the snapshot on New Year's Day
- oxlint's vitest plugin warns (`pnpm run lint` still exits 0) when a `describe` title isn't lowercase or repeats an imported identifier, or a hook sits outside a `describe` block — the convention is kept repo-wide regardless
- Test files, `test-utils/**` and `vitest.config.ts` are exempt from `sort-keys`, `no-magic-numbers`, `max-lines`, `max-lines-per-function` and `typescript/no-unsafe-type-assertion` in `oxlint.config.ts` — widen a single rule inline, never the override itself
- Mock external services at the `fetch` boundary, not the module boundary; Resend is planned as the one exception, mocked at the SDK level
- `pnpm run test:coverage` writes `coverage/lcov.info` per workspace for CI/SonarQube. Every `vitest.config.ts` sets `coverage.include` so untested files count as uncovered instead of dropping out of the denominator — Vitest 4 removed `coverage.all`, and without `include` V8 only scores the files a test happened to import, which inflated every figure
- Each `vitest.config.ts` carries `coverage.thresholds`, so `test:coverage` fails when coverage drops: `packages/shared` and `packages/email` at 100% everywhere, `apps/web` at 91% lines and statements / 83% functions / 81% branches (it reaches 92.6% / 85.6% / 84.1%), `apps/studio` at the level its schema tests currently reach (23% lines). They are a ratchet — raise them with every batch of new tests, never lower them to make a run pass
- 100% is deliberately not the goal for `apps/web`. What is left is a long tail of single branches plus places the harness cannot reach: an `async` mark component in `portable-text.tsx` (React cannot render one on the client, the tree suspends) and the import-time bindings in `lib/sanity/live.ts` and `lib/sanity/client.ts`. Covering those means testing the framework, not the app
- Pure re-export barrels are excluded from coverage (`**/index.ts` in `packages/shared`) — they hold no executable statements, so V8 scores them 0% and importing one in a test would lift the number without testing anything. Do not copy that glob into `apps/web` or `apps/studio`: their `index.ts` files carry real logic (GROQ fragments, schema definitions, the desk structure) and must stay in the denominator. `packages/email` excludes `scripts/**` (a top-level-await build script that writes to `dist/`) and `newsletter-event.ts` (an interface declaration) for the same reason: V8 scores a file with no executable statements as 0% of 0, which leaves a red row in the table without changing any total

### Performance & Best Practices

- **Server Components** by default, minimal client components
- **Responsive design** with mobile-first Tailwind approach
- **Image optimization** using next/image with WebP format
- **Type-safe server actions** with next-safe-action
- **Form validation** with react-hook-form + Zod
- **No `try`/`catch`/`finally` in components or hooks** - the React Compiler bails out on a `finally` block. Await with `settle()` from `@tsgi-web/shared` and branch on `outcome.ok` instead.
