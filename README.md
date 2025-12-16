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

This is a **monorepo** built with **Turbo** and **bun** containing:

- **`apps/web`** - Next.js 16 frontend application with App Router
- **`apps/studio`** - Sanity Studio CMS for content management
- **`packages/email`** - React Email templates for transactional emails
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

### Email (packages/email)

- **React Email** for transactional email templates
- **Resend** integration for email delivery

### Development Tools

- **Turbo** for build orchestration and caching
- **bun** for package management with workspace support
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
│   ├── email/               # React Email templates
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

- **Node.js** ^22.21.1
- **bun** 1.3.4 package manager
- **Git** for version control
- **@antfu/ni** for talking to the package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd web
   ```

2. **Install @antfu/ni globally**

   ```bash
   npm i -g @antfu/ni
   ```

3. **Install dependencies**

   ```bash
   ni
   ```

4. **Set up environment variables**

   For the Studio (`apps/studio/.env`):

   ```bash
   SANITY_API_DATASET=production
   SANITY_API_PROJECT_ID=your_project_id
   SANITY_API_READ_TOKEN=your_read_token
   SANITY_API_VERSION=2025-02-19
   SANITY_API_WRITE_TOKEN=your_write_token
   ```

   For the Web app (`apps/web/.env.local`):

   ```bash
   NEXT_PUBLIC_SANITY_API_VERSION=2025-02-19
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333
   SANITY_API_READ_TOKEN=your_read_token
   SANITY_REVALIDATE_SECRET=your_revalidate_secret
   RESEND_API_KEY=your_resend_api_key
   LINEAR_API_KEY=your_linear_api_key
   LINEAR_TEAM_ID=your_linear_team_id
   VERCEL_OIDC_TOKEN=your_vercel_token
   VERCEL_URL=your_vercel_url
   ```

5. **Start development servers**

   ```bash
   nr dev
   ```

## 📜 Available Scripts

### Root Commands

```bash
nr dev                    # Start all apps in development mode
nr dev:email              # Start React Email preview server
nr build                  # Build all apps for production
nr build:affected         # Build only affected packages
nr lint                   # Lint all apps
nr lint:affected          # Lint only affected packages
nr typecheck              # Type check all apps
nr typegen:sanity         # Generate Sanity types for web app
nr typegen:routes         # Generate Next.js route types
```

### Individual App Commands

#### Web App (apps/web)

```bash
cd apps/web
nr dev                    # Next.js dev server
nr build                  # Production build
nr start                  # Start production server
nr typecheck              # Type check with TypeScript
nr typegen:sanity         # Generate Sanity types
nr typegen:routes         # Generate Next.js route types
```

#### Studio App (apps/studio)

```bash
cd apps/studio
nr dev                    # Sanity Studio development
nr build                  # Build Sanity Studio
nr deploy                 # Deploy studio to Sanity
nr extract-types          # Extract schema types for typegen
nr typecheck              # Type check with TypeScript
```

#### Email Package (packages/email)

```bash
cd packages/email
nr dev:email              # React Email preview server (port 3001)
nr build                  # Build email templates
nr export                 # Export email templates
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

For questions about this project, please contact the development team or visit our
[contact page](https://www.tsg-irlich.de/kontakt).
