# @tsgi-web/shared

Shared utilities, components, and types for the TSG Irlich website monorepo.

## Overview

This package contains reusable code shared across the monorepo, including:

- **Utility functions** for common operations
- **React components** for logos and icons
- **Type definitions** for shared types

## Installation

This package is automatically available to other packages in the monorepo via workspace dependencies.

## Exports

### Utilities

#### `cn(...inputs: ClassValue[]): string`

Combines multiple class names into a single string, merging Tailwind CSS classes efficiently. Uses `clsx` for conditional class
names and `tailwind-merge` to handle Tailwind class conflicts.

```tsx
import { cn } from '@tsgi-web/shared';

// Basic usage
cn('p-4', 'bg-blue-500', { 'text-white': true });
// 'p-4 bg-blue-500 text-white'

// Deduplicates conflicting classes
cn('p-2 p-4'); // 'p-4'
```

#### `shuffleArray<T>(array: T[]): T[]`

Shuffles an array using the Fisher-Yates shuffle algorithm. Returns a new array without mutating the original.

```tsx
import { shuffleArray } from '@tsgi-web/shared';

const numbers = [1, 2, 3, 4, 5];
const shuffled = shuffleArray(numbers);
// Returns a shuffled copy of the array
```

### Components

#### `DOSBIcon`

Component for rendering DOSB (German Olympic Sports Confederation) sport icons. Accepts an `icon` prop with the sport name.

**Available icons:**

- `Badminton`
- `Bodenturnen`
- `Cheerleading`
- `Fitness`
- `Fussball`
- `Gymnastik`
- `Jujutsu`
- `Pilates`
- `RopeSkipping`
- `SportInGebaeuden`
- `Sportakrobatik`
- `StepAerobic`
- `Taekwondo`
- `Tanzen`
- `Turnen`
- `Wandern`
- `Yoga`

```tsx
import { DOSBIcon } from '@tsgi-web/shared';

<DOSBIcon className="h-12 w-auto" icon="Fussball" />;
```

#### `TSGLogo`

SVG logo component for TSG Irlich. Accepts standard SVG props and uses `className` for styling.

```tsx
import { TSGLogo } from '@tsgi-web/shared';

<TSGLogo className="h-16 w-auto" />;
```

### Types

#### `DosbIconName`

Type for valid DOSB icon names.

```tsx
import type { DosbIconName } from '@tsgi-web/shared';

const iconName: DosbIconName = 'Fussball';
```

## Available Scripts

| Script      | Description                  |
| ----------- | ---------------------------- |
| `lint`      | Run ESLint with auto-fix     |
| `typecheck` | Run TypeScript type checking |

## Dependencies

- `clsx` - Utility for constructing className strings conditionally
- `react` - React library
- `react-dom` - React DOM library
- `tailwind-merge` - Merge Tailwind CSS classes without style conflicts

## Usage in Other Packages

Import from the package name:

```tsx
import { cn, DOSBIcon, shuffleArray, TSGLogo } from '@tsgi-web/shared';
import type { DosbIconName } from '@tsgi-web/shared';
```
