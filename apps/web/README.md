# TSG Irlich Website

Next.js 16 frontend application for TSG Irlich, a German sports club. Built with TypeScript, Tailwind CSS, Shadcn UI, and Sanity
CMS.

## Overview

This is the main web application for the TSG Irlich website, featuring:

- **Next.js 16** with App Router architecture
- **Server Components** by default for optimal performance
- **Sanity CMS** integration for content management
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **React Hook Form** + **Zod** for form validation
- **Next Safe Action** for type-safe server actions

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

Start the development server:

```bash
# From monorepo root (recommended)
bun run dev

# Or from this directory
cd apps/web
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

| Script           | Description                                   |
| ---------------- | --------------------------------------------- |
| `dev`            | Start Next.js development server              |
| `build`          | Build the application for production          |
| `start`          | Start the production server                   |
| `lint`           | Run ESLint with auto-fix                      |
| `typecheck`      | Run TypeScript type checking                  |
| `typegen:sanity` | Generate TypeScript types from Sanity schemas |
| `typegen:routes` | Generate Next.js route types                  |

## Project Structure

```text
apps/web/
├── src/
│   ├── actions/            # Server actions (Linear, contact form)
│   ├── app/                # Next.js App Router pages
│   │   ├── (legal)/        # Legal pages (privacy, imprint)
│   │   ├── angebot/        # Offer/group pages
│   │   ├── api/            # API routes
│   │   ├── kontakt/        # Contact pages
│   │   ├── mitgliedschaft/ # Membership pages
│   │   ├── news/           # News articles
│   │   └── verein/         # About us pages
│   ├── components/         # React components
│   │   ├── layout/         # Layout components (footer, etc.)
│   │   ├── section/        # Page sections
│   │   ├── ui/             # Shadcn UI components
│   │   └── with-logic/     # Components with business logic
│   ├── constants/          # App constants
│   ├── hooks/              # React hooks
│   ├── icons/              # Custom icons
│   ├── images/             # Static images
│   ├── lib/                # Utilities and helpers
│   │   ├── actions/        # Action utilities
│   │   ├── resend.ts       # Email service
│   │   ├── sanity/         # Sanity CMS integration
│   │   └── validations/    # Zod schemas
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
└── public/                 # Static assets
```

## Key Technologies

### Core

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Styling

- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn UI** - Component library with CVA patterns
- **CSS Modules** - Component-scoped styles

### Content Management

- **Sanity CMS** - Headless CMS
- **GROQ** - Query language for Sanity
- **next-sanity** - Sanity integration for Next.js

### Forms & Validation

- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Zod integration

### Other

- **next-safe-action** - Type-safe server actions
- **Resend** - Email service
- **Vercel Analytics** - Analytics
- **@tsgi-web/shared** - Shared utilities and components
- **@tsgi-web/email** - Email templates

## Environment Variables

Create a `.env.local` file in `apps/web/` with the following variables:

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_API_VERSION=2025-02-19
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333
SANITY_API_READ_TOKEN=your_read_token
SANITY_REVALIDATE_SECRET=your_revalidate_secret

# Email
RESEND_API_KEY=your_resend_api_key

# Linear (for issue tracking)
LINEAR_API_KEY=your_linear_api_key
LINEAR_TEAM_ID=your_linear_team_id

# Vercel
VERCEL_OIDC_TOKEN=your_vercel_token
VERCEL_URL=your_vercel_url
```

## Type Generation

After making changes to Sanity schemas, generate TypeScript types:

```bash
# From monorepo root (recommended)
turbo extract-types && turbo typegen:sanity

# Or manually
cd apps/studio && bun run extract-types
cd apps/web && bun run typegen:sanity
```

Generate Next.js route types:

```bash
cd apps/web
bun run typegen:routes
```

## Code Conventions

### Components

- Use **function declarations** (not arrow functions)
- Prefer **named exports** over default exports
- Place **TypeScript interfaces** at the end of files
- Minimize `'use client'` usage - prefer server components

**Example:**

```tsx
export function MyComponent({ title }: MyComponentProps) {
	return <div>{title}</div>;
}

interface MyComponentProps {
	title: string;
}
```

### File Naming

- Use **kebab-case** for file and directory names
- Use `.tsx` for React components, `.ts` for utilities
- Use `.module.css` for CSS modules

### Styling Guidelines

- Use **Tailwind CSS** utility classes
- Follow **Shadcn UI** component patterns
- Use **CSS Modules** for component-specific styles
- Mobile-first responsive design

## Building for Production

```bash
# Build the application
bun run build

# Start production server
bun run start
```

## Deployment

The application is deployed on **Vercel**. The deployment process is automated via:

- Git push to main branch triggers deployment
- Environment variables configured in Vercel dashboard
- Sanity webhooks configured for on-demand revalidation

See [SANITY_WEBHOOK_SETUP.md](../../docs/SANITY_WEBHOOK_SETUP.md) for webhook configuration.

## Development Workflow

1. **Make changes** to code or Sanity schemas
2. **Generate types** if schemas changed (`bun run typegen:sanity`)
3. **Run linting** (`bun run lint`)
4. **Type check** (`bun run typecheck`)
5. **Test locally** (`bun run dev`)
6. **Build** to verify (`bun run build`)

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Detailed project documentation
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [packages/shared/README.md](../../packages/shared/README.md) - Shared package docs
- [packages/email/README.md](../../packages/email/README.md) - Email templates docs

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
