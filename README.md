# TSG Irlich Website 2026

A modern, full-stack website for TSG Irlich 1882, a German sports club (Turn- und Sportgemeinde) located in Neuwied/Irlich. This
project features a Next.js frontend with Sanity CMS for content management, built as a monorepo using modern web technologies.

## Table of Contents

- [🏗️ Project Architecture](#️-project-architecture)
- [🚀 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🎯 Features](#-features)
- [🛠️ Development Setup](#️-development-setup)
- [📜 Available Scripts](#-available-scripts)
- [🏃‍♂️ Sports Groups \& Departments](#️-sports-groups--departments)
- [📝 Content Management](#-content-management)
- [🎨 Design System](#-design-system)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact](#-contact)

## 🏗️ Project Architecture

This is a **monorepo** built with **Turbo** and **pnpm** containing:

- **`apps/web`** - Next.js 16 frontend application with App Router
- **`apps/studio`** - Sanity Studio CMS for content management
- **`packages/shared`** - Shared utilities, types, and components

## 🚀 Tech Stack

### Frontend (apps/web)

- **Next.js 16** with App Router and Turbopack
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Radix UI** components with custom styling
- **Shadcn/ui** component library
- **Sanity Client** for headless CMS integration
- **Vercel Analytics** for performance monitoring

### CMS (apps/studio)

- **Sanity 4** headless CMS
- **Sanity Studio** with custom configuration
- **German localization** support
- **Custom plugins** for enhanced functionality
- **Media management** with Sanity plugins

### Development Tools

- **Turbo** for build orchestration and caching
- **pnpm** for package management with workspace support
- **ESLint** with custom configuration
- **Prettier** with Tailwind CSS plugin
- **Commitlint** for conventional commits
- **Husky** for git hooks
- **TypeScript** for type safety

## 📁 Project Structure

```text
tsg-web/
├── apps/
│   ├── web/                 # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── lib/         # Utilities and configurations
│   │   │   └── types/       # TypeScript type definitions
│   │   └── public/          # Static assets
│   └── studio/              # Sanity Studio CMS
│       ├── schemas/         # Content schemas
│       ├── plugins/         # Custom Sanity plugins
│       └── components/      # Studio UI components
├── packages/
│   └── shared/              # Shared utilities and types
└── turbo.json               # Turbo configuration
```

## 🎯 Features

### Website Features

- **Multi-language support** (German)
- **Responsive design** for all devices
- **SEO optimized** with Next.js metadata
- **Performance optimized** with image optimization
- **About us** description of the club
- **Contact forms** with validation
- **News and blog** system
- **Sports groups** and departments showcase
- **Member testimonials**
- **Training schedules**

### CMS Features

- **Content management** for all website sections
- **Media library** with image optimization
- **User management** and permissions
- **Content versioning** and publishing workflow
- **Custom content types** for sports groups
- **SEO metadata** management

## 🛠️ Development Setup

### Prerequisites

- **Node.js** >= 22.20.0
- **pnpm** package manager
- **Git** for version control

### Installation

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

   For the Studio (`apps/studio/.env`):

   ```bash
   SANITY_API_PROJECT_ID=your_project_id
   SANITY_API_DATASET=production
   SANITY_API_READ_TOKEN=your_read_token
   SANITY_API_WRITE_TOKEN=your_write_token
   SANITY_API_VERSION=2024-01-01
   ```

   For the Web app (`apps/web/.env.local`):

   ```bash
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
   SANITY_API_READ_TOKEN=your_read_token
   NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333
   ```

4. **Start development servers**

   ```bash
   pnpm dev
   ```

## 📜 Available Scripts

### Root Commands

```bash

pnpm dev                    # Start all apps in development mode
pnpm build                  # Build all apps for production
pnpm build:affected         # Build only affected packages
pnpm lint                   # Lint all apps
pnpm lint:affected          # Lint only affected packages
pnpm typegen                # Generate Sanity types for web app
pnpm extract-types          # Extract Sanity schema types
```

### Individual App Commands

#### Web App (apps/web)

```bash
cd apps/web
pnpm dev                    # Next.js dev server with Turbopack
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm typegen                # Generate Sanity types
```

#### Studio App (apps/studio)

```bash
cd apps/studio
pnpm dev                    # Sanity Studio development
pnpm build                  # Build Sanity Studio
pnpm deploy                 # Deploy studio to Sanity
pnpm extract-types          # Extract schema types
```

## 🏃‍♂️ Sports Groups & Departments

The website supports various sports groups including:

- **Gymnastics** (Children & Adults)
- **Soccer** (Multiple age groups)
- **Dance** (Various styles)
- **Taekwondo** (Martial arts)
- **Other Sports** (Flexible categories)
- **Courses** (Specialized training)

## 📝 Content Management

The Sanity Studio provides content management for:

- **Pages** (Home, About, Contact, etc.)
- **News Articles** with categories
- **Sports Groups** with detailed information
- **People** (Members, coaches, staff)
- **Testimonials** from members
- **Venues** and training locations
- **Training Schedules** and times

## 🎨 Design System

- **Tailwind CSS** for utility-first styling
- **Custom design tokens** for consistent theming
- **Responsive breakpoints** for all devices
- **Accessibility** compliant components
- **German typography** optimized

## 🚀 Deployment

The project is configured for deployment on:

- **Vercel** (recommended for Next.js)
- **Sanity** (for the CMS)
- **Any Node.js hosting** platform

## 🤝 Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull
requests.

## 📄 License

This project is private and proprietary to TSG Irlich 1882.

## 📞 Contact

For questions about this project, please contact the development team or visit our [contact page](https://tsg-irlich.de/kontakt).
