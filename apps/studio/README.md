# TSG Irlich Sanity Studio

Sanity Studio CMS for managing content for the TSG Irlich website. This is the content management interface where editors can
create and manage sports groups, news articles, people, testimonials, and other content.

## Overview

This Sanity Studio instance provides a custom content editing environment for the TSG Irlich website, featuring:

- **Sanity Studio 5** - Modern content editing interface
- **Custom schemas** for sports groups, news, people, and more
- **German language** interface for content editors
- **Type-safe** schema definitions with TypeScript
- **Custom components** and plugins
- **Type generation** for the web app

## Getting Started

### Prerequisites

- **Node.js** ^24.12.0
- **bun** 1.3.5 (package manager)
- Environment variables configured (see [Environment Variables](#environment-variables))

### Installation

From the monorepo root:

```bash
bun install
```

### Development

Start the Sanity Studio development server:

```bash
# From monorepo root (recommended)
bun run dev

# Or from this directory
cd apps/studio
bun run dev
```

Open [http://localhost:3333](http://localhost:3333) to access the Studio interface.

## Available Scripts

| Script           | Description                            |
| ---------------- | -------------------------------------- |
| `dev`            | Start Sanity Studio development server |
| `build`          | Build Sanity Studio for production     |
| `start`          | Start the production Studio server     |
| `deploy`         | Deploy Studio to Sanity hosting        |
| `deploy:graphql` | Deploy GraphQL API                     |
| `deploy:schema`  | Deploy schema definitions              |
| `extract-types`  | Extract schema types for typegen       |
| `lint`           | Run ESLint with auto-fix               |
| `typecheck`      | Run TypeScript type checking           |

## Project Structure

```text
apps/studio/
├── components/          # Custom Studio components
│   ├── logo.tsx         # Studio logo
│   ├── text-input.tsx   # Custom text input
│   └── time-picker.tsx  # Time picker component
├── constants/           # App constants
│   ├── departments.ts   # Sports department definitions
│   └── regex.ts         # Regular expressions
├── plugins/             # Sanity plugins
│   ├── assist.ts        # AI assist plugin
│   ├── index.ts         # Plugin exports
│   └── singleton.ts     # Singleton document plugin
├── schemas/             # Sanity schema definitions
│   ├── documents/       # Document types
│   │   ├── author.ts
│   │   ├── group.*.ts   # Sports group schemas
│   │   ├── news.*.ts    # News schemas
│   │   ├── person.ts
│   │   └── ...
│   ├── objects/         # Object types
│   ├── sections/        # Section types
│   ├── single-pages/    # Page-specific schemas
│   └── singletons/      # Singleton document schemas
├── shared/              # Shared schema utilities
│   ├── fields/          # Reusable field definitions
│   └── sections/        # Reusable section definitions
├── structure/           # Studio structure configuration
├── utils/               # Utility functions
├── env.ts               # Environment configuration
├── sanity.config.ts     # Sanity Studio configuration
└── sanity.cli.ts        # Sanity CLI configuration
```

## Content Types

### Documents

- **Groups** - Sports department groups (Soccer, Taekwondo, Dance, etc.)
- **News Articles** - News posts with categories
- **People** - Club members, coaches, and staff
- **Testimonials** - Member testimonials
- **Authors** - Content authors
- **Roles** - Organizational roles
- **Honorary Members** - Honorary club members
- **Venues** - Training and event locations

### Singletons

- **Site Settings** - Global site configuration
- **Privacy** - Privacy policy page

### Pages

- **Home** - Homepage content
- **About Us** - About page content
- **Contact** - Contact page
- **Membership** - Membership information
- **Offer** - Sports offerings overview
- **News Overview** - News listing pages
- **Single Group** - Individual group pages

## Schema Development

### Rules

- Always use `defineField()` for every field and `defineType()` for types
- Import `defineField`, `defineType`, `defineArrayMember` from 'sanity'
- Include icons from `lucide-react` or `sanity/icons`
- Use **German titles and descriptions** for content editors
- Follow the established schema folder structure

### Example Schema

```tsx
import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const mySchemaType = defineType({
	fields: [
		defineField({
			name: 'title',
			title: 'Titel',
			type: 'string',
			validation: Rule => Rule.required(),
		}),
	],
	icon: FileText,
	name: 'myType',
	title: 'Mein Typ',
	type: 'document',
});
```

### Field Groups

Use field groups to organize complex schemas. Field groups are defined in `shared/field-groups.ts` and can be reused across
schemas.

## Type Generation

After making changes to Sanity schemas, extract types for use in the web app:

```bash
# From monorepo root (recommended)
turbo extract-types && turbo typegen:sanity

# Or manually
cd apps/studio && bun run extract-types
cd apps/web && bun run typegen:sanity
```

The `extract-types` script:

- Extracts TypeScript types from schema definitions
- Enforces required fields
- Outputs to `sanity-typegen.json`

## Environment Variables

Create a `.env` file in `apps/studio/` with the following variables:

```bash
# Sanity Configuration
SANITY_API_DATASET=production
SANITY_API_PROJECT_ID=your_project_id
SANITY_API_READ_TOKEN=your_read_token
SANITY_API_VERSION=2025-02-19
SANITY_API_WRITE_TOKEN=your_write_token
```

These are loaded via `env.ts` and used in `sanity.config.ts`.

## Deployment

### Deploy Studio to Sanity

Deploy the Studio to Sanity's hosting:

```bash
bun run deploy
```

This builds and deploys the Studio to `https://your-project.sanity.studio`.

### Deploy GraphQL API

Deploy the GraphQL API schema:

```bash
bun run deploy:graphql
```

### Deploy Schema Definitions

Deploy schema definitions separately:

```bash
bun run deploy:schema
```

## Plugins

### Sanity Assist

AI-powered content assistance for editors. Configured in `plugins/assist.ts`.

### Sanity Vision

GROQ query playground for testing queries. Accessible via the Vision tool in Studio.

### Media Plugin

Enhanced media management with `sanity-plugin-media`.

### Custom Plugins

- **Singleton Plugin** - Manages singleton document types (site settings, privacy)

## Code Conventions

### File Naming

- Use **kebab-case** for file and directory names
- Use `.ts` for schema files, `.tsx` for React components
- Group related schemas (e.g., `group.*.ts` for group types)

### Schema Organization

- **Documents** - Main content types in `schemas/documents/`
- **Objects** - Reusable object types in `schemas/objects/`
- **Sections** - Page section types in `schemas/sections/`
- **Single Pages** - Page-specific schemas in `schemas/single-pages/`
- **Singletons** - Singleton documents in `schemas/singletons/`
- **Shared** - Reusable fields and sections in `shared/`

### Component Development

- Use **function declarations** for React components
- Prefer **named exports** over default exports
- Place **TypeScript interfaces** at the end of files

## Studio Configuration

The Studio is configured in `sanity.config.ts`:

- **Title**: "TSG Irlich 1882"
- **Icon**: Custom logo component
- **Plugins**: Assist, Vision, Media, and custom plugins
- **Singleton Types**: `privacy`, `site-settings`
- **Document Actions**: Filtered for singleton types

## Development Workflow

1. **Make schema changes** in `schemas/`
2. **Test locally** with `bun run dev`
3. **Extract types** with `bun run extract-types`
4. **Generate web types** (from web app): `bun run typegen:sanity`
5. **Run linting** (`bun run lint`)
6. **Type check** (`bun run typecheck`)
7. **Deploy** when ready (`bun run deploy`)

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Detailed project documentation
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [apps/web/README.md](../web/README.md) - Web app documentation
- [Sanity Documentation](https://www.sanity.io/docs)
- [Sanity Schema Types](https://www.sanity.io/docs/schema-types)

## Learn More

- [Sanity Studio Documentation](https://www.sanity.io/docs/content-studio)
- [Sanity Schema Guide](https://www.sanity.io/docs/schema-types)
- [Sanity Plugins](https://www.sanity.io/docs/plugins)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
