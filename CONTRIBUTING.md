# Contributing to TSG Irlich Website

Thank you for your interest in contributing to the TSG Irlich website! This document provides guidelines and instructions for
contributing to this project.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Getting Started](#getting-started)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Common Development Tasks](#common-development-tasks)
- [Getting Help](#getting-help)
- [Code of Conduct](#code-of-conduct)

## Getting Started

### Prerequisites

- **Node.js** >= 22.15
- **pnpm** (package manager)
- **Git** for version control

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd web
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   For the Studio (apps/studio/.env):

   ```bash
   SANITY_API_PROJECT_ID=
   SANITY_API_DATASET=
   SANITY_API_READ_TOKEN=
   SANITY_API_WRITE_TOKEN=
   SANITY_API_VERSION=
   ```

   For the Web app (apps/web/.env.local):

   ```bash
   NEXT_PUBLIC_SANITY_PROJECT_ID=
   NEXT_PUBLIC_SANITY_DATASET=
   NEXT_PUBLIC_SANITY_API_VERSION=
   SANITY_API_READ_TOKEN=
   NEXT_PUBLIC_SANITY_STUDIO_URL=
   ```

4. **Start development servers**

   ```bash
   pnpm dev
   ```

## Code Standards

### File & Directory Naming

- Use **kebab-case** for all file and directory names
- Use `.tsx` for React components, `.ts` for utilities
- Use `.module.css` for CSS modules (alongside Tailwind)

### Code Naming Conventions

- **camelCase** for variables, functions, methods
- **PascalCase** for classes, types, interfaces, React components
- **CONSTANT_CASE** for constants and enum values
- Use descriptive names with auxiliary verbs (e.g., `isLoading`, `hasError`, `canDelete`)

### Component Architecture

- Use **function declarations** (not const) for React components
- Prefer **named exports** over default exports
- Place TypeScript interfaces at the end of files
- Follow **micro folder structure** - break components into small, focused parts
- Minimize 'use client' usage - prefer server components

**Example:**

```tsx
export function MyComponent({ title }: MyComponentProps) {
	return <div>{title}</div>;
}

interface MyComponentProps {
	title: string;
}
```

### React & Next.js Best Practices

- **Server Components** by default - only use 'use client' when necessary
- Use Next.js 15 App Router patterns
- Implement responsive design with mobile-first Tailwind approach
- Optimize images using `next/image`
- Use error boundaries with `error.tsx` files
- Implement type-safe server actions with `next-safe-action`
- Use `react-hook-form` + `Zod` for form validation

### Styling Guidelines

- Use **Tailwind CSS** with utility-first approach
- Follow **Shadcn UI** component patterns with CVA (Class Variance Authority)
- Components in `src/components/ui/` should follow Shadcn conventions

### Sanity CMS Development

#### Schema Rules

- Always use `defineField()` for every field and `defineType()` for types
- Import from 'sanity': `defineField`, `defineType`, `defineArrayMember`
- Include icons from `lucide-react` or `sanity/icons`
- Use German titles and descriptions for content editors
- Follow the established schema folder structure

**Example:**

```ts
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

#### GROQ Queries

- Import `defineQuery` and `groq` from 'next-sanity'
- Export queries as constants using `defineQuery`
- **Do not expand images** in GROQ unless explicitly needed
- Use reusable fragments with underscore prefix (e.g., `_richText`, `_buttons`)
- Use camelCase naming with "Query" suffix

**Example:**

```ts
import { defineQuery, groq } from 'next-sanity';

export const myDataQuery = defineQuery(groq`
  *[_type == "myType"] {
    _id,
    title,
    description
  }
`);
```

#### Type Generation After Schema Changes

After making any changes to Sanity schemas, always run:

```bash
pnpm extract-types  # Extract from studio
pnpm typegen       # Generate types for web
```

## Commit Guidelines

This project uses **Conventional Commits** with Commitizen.

### Commit Message Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Scopes

- **web**: Changes to the web app (apps/web)
- **studio**: Changes to Sanity Studio (apps/studio)
- **shared**: Changes to shared packages
- **deps**: Dependency updates

### Using Commitizen

```bash
git add .
pnpm commit  # or use commitizen CLI
```

### Examples

```text
feat(web): add membership registration form

fix(studio): correct schema validation for news articles

docs: update contributing guidelines

chore(deps): update all non-major dependencies
```

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Follow code standards
   - Write meaningful commit messages
   - Keep changes focused and atomic

3. **Run quality checks**

   ```bash
   pnpm lint              # Run linting
   pnpm lint:cspell       # Run spell check
   pnpm build             # Ensure build succeeds
   ```

4. **Push your branch**

   ```bash
   git push origin feat/your-feature-name
   ```

5. **Create a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Ensure all CI checks pass
   - Request review from maintainers

6. **Address review feedback**
   - Make requested changes
   - Push additional commits
   - Re-request review when ready

### Pull Request Checklist

- [ ] Code follows project conventions
- [ ] Commits follow conventional commit format
- [ ] All linting checks pass
- [ ] Build succeeds without errors
- [ ] Types are generated if Sanity schemas changed
- [ ] Documentation updated if needed
- [ ] No console errors or warnings

## Project Structure

```text
web/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/
│   │   │   ├── lib/      # Utilities and helpers
│   │   │   └── styles/
│   │   └── package.json
│   └── studio/           # Sanity CMS
│       ├── schemas/      # Content schemas
│       └── package.json
├── packages/
│   └── shared/           # Shared utilities
├── turbo.json           # Turbo configuration
└── package.json         # Root package.json
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific app
cd apps/web
pnpm test
```

### Writing Tests

- Write tests for new features
- Ensure edge cases are covered
- Use descriptive test names
- Follow existing test patterns

## Common Development Tasks

### Adding a New Component

1. Create component file in appropriate directory
2. Use function declaration syntax
3. Add TypeScript interface at end of file
4. Export as named export
5. Update related imports

### Adding a New Sanity Schema

1. Create schema file in `apps/studio/schemas/`
2. Use `defineType()` and `defineField()`
3. Add German titles/descriptions
4. Include appropriate icon
5. Run type generation: `pnpm extract-types && pnpm typegen`

### Updating Dependencies

```bash
# Update all non-major dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

## Getting Help

- Check existing issues and pull requests
- Review project documentation in [CLAUDE.md](CLAUDE.md)
- Ask questions in pull request comments
- Contact maintainers for guidance

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help create a welcoming environment

---

Thank you for contributing to TSG Irlich website! 🎉
