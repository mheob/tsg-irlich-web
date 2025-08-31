# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TSG Irlich website - a Next.js application with Sanity CMS for a German sports club. This is a monorepo built with Turbo
containing:

- **apps/web**: Next.js 15 frontend with App Router, TypeScript, Tailwind CSS, Shadcn UI
- **apps/studio**: Sanity Studio CMS for content management
- **packages/shared**: Shared utilities and types

## Development Commands

### Root Commands (use these for most tasks)

```bash
# Development
pnpm dev                    # Start all apps in development mode
turbo dev                   # Alternative using turbo directly

# Building
pnpm build                  # Build all apps
pnpm build:affected         # Build only affected packages
turbo build --affected      # Alternative using turbo directly

# Linting & Code Quality
pnpm lint                   # Lint all apps
pnpm lint:affected          # Lint only affected packages
pnpm lint:root              # Lint root directory files
pnpm lint:cspell            # Run spell check

# Type Generation
pnpm typegen                # Generate Sanity types for web app
pnpm extract-types          # Extract Sanity schema types
```

### Individual App Commands

```bash
# Web app (apps/web)
cd apps/web
pnpm dev                    # Next.js dev server with Turbopack
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # ESLint with auto-fix
pnpm typegen               # Generate Sanity types

# Studio app (apps/studio)
cd apps/studio
pnpm dev                    # Sanity Studio development
pnpm build                  # Build Sanity Studio
pnpm deploy                 # Deploy studio to Sanity
pnpm extract-types          # Extract schema types for typegen
```

## Architecture & Code Organization

### Monorepo Structure

- Built with **Turbo** for build orchestration and caching
- **pnpm** as package manager with workspace support
- Shared dependencies managed via catalog: references
- Node.js >=22.15 required

### Web App (Next.js)

- **App Router** architecture with server components as default
- **Minimal 'use client'** usage - prefer server-side rendering
- **Tailwind CSS** with utility-first approach
- **Shadcn UI** components following CVA (Class Variance Authority) patterns
- **Sanity** as headless CMS with GROQ queries

### Component Architecture

- **Micro folder structure** - components broken into small, focused parts
- **Function declarations** (not const) for React components
- **Named exports** preferred over default exports
- **TypeScript interfaces** at file end
- Components in `src/components/ui/` follow Shadcn patterns

### Sanity CMS Integration

- **Content types**: Groups (sports departments), News, People, Testimonials
- **GROQ queries** in `src/lib/sanity/queries/`
- **Type generation** from Sanity schema to TypeScript
- **Image optimization** with next/image and Sanity image URLs

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
- Include icons from lucide-react or sanity/icons
- German titles and descriptions for content editors
- Follow the established schema folder structure

### GROQ Queries

- Import `defineQuery` and `groq` from 'next-sanity'
- Export queries as constants using `defineQuery`
- **Do not expand images** in GROQ unless explicitly needed
- Use reusable fragments with underscore prefix (`_richText`, `_buttons`)
- camelCase naming with "Query" suffix

### Type Generation Workflow

```bash
# After schema changes, always run:
pnpm extract-types          # Extract from studio
pnpm typegen               # Generate types for web
```

## Environment & Configuration

### Required Environment Variables

**Studio (.env)**:

- `SANITY_API_PROJECT_ID`
- `SANITY_API_DATASET`
- `SANITY_API_READ_TOKEN`
- `SANITY_API_WRITE_TOKEN`
- `SANITY_API_VERSION`

**Web (.env.local)**:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `SANITY_API_READ_TOKEN`
- `NEXT_PUBLIC_SANITY_STUDIO_URL`

### Code Quality Tools

- **ESLint** with @mheob/eslint-config
- **Prettier** with @mheob/prettier-config
- **Husky** + **lint-staged** for pre-commit hooks
- **cspell** for spell checking
- **Commitizen** with cz-git for conventional commits

### Performance & Best Practices

- **Server Components** by default, minimal client components
- **Responsive design** with mobile-first Tailwind approach
- **Image optimization** using next/image with WebP format
- **Error boundaries** with error.tsx files
- **Type-safe server actions** with next-safe-action
- **Form validation** with react-hook-form + Zod
