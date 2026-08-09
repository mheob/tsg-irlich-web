---
name: update-md-data
description: Update all .md files with current project data (versions, tool names, etc.)
user-invocable: true
allowed-tools: Bash(cat*), Bash(find*), Bash(grep*), Bash(node*), Bash(bun*), Read(*), Edit(*)
---

## Context

Gather the current ground-truth data before touching any file:

- Root `package.json` (engines, packageManager, devDependencies): !`cat package.json`
- Web app `package.json` (next, react, tailwindcss, sanity, …): !`cat apps/web/package.json`
- Studio `package.json`: !`cat apps/studio/package.json`
- All markdown files in the project (excluding node_modules and tool-generated dirs): !`find . -name "*.md" ! -path "*/node_modules/*" ! -path "*/.claude/*" ! -path "*/.react-email/*" | sort`

## Your task

For every `.md` file found above, scan the content and replace any outdated project data with the current values extracted from the `package.json` files. Key data points to keep in sync:

### Versions to update

| Data point | Source |
| --- | --- |
| `bun` version (package manager) | `packageManager` field in root `package.json` (strip the `bun@` prefix) |
| Node.js version requirement | `engines.node` in root `package.json` |
| Next.js major version (e.g. "Next.js 16") | `dependencies.next` in `apps/web/package.json` |
| React major version (e.g. "React 19") | `dependencies.react` in `apps/web/package.json` |
| Tailwind CSS major version (e.g. "Tailwind CSS 4") | `dependencies.tailwindcss` in `apps/web/package.json` |
| Sanity major version (e.g. "Sanity 5") | `dependencies.sanity` in `apps/web/package.json` |
| TypeScript major version | `devDependencies.typescript` in root `package.json` |
| Turbo major version | `devDependencies.turbo` in root `package.json` |

### Rules

- Update **version numbers** wherever they appear in prose, headings, badges, code blocks, or inline text (e.g. `bun 1.3.5` → `bun 1.3.11`, `Node.js ^24.12.0` → `Node.js ^24.14.1`).
- Preserve the formatting style already used in each file — if it says `bun 1.3.5`, keep the same style; if it says `**bun** 1.3.5`, keep the bold.
- Do **not** change placeholder values like `your_project_id`, `your_read_token`, etc.
- Do **not** modify code logic, comments, or anything that is not a version/tool reference.
- Skip files that contain no references to any of the tracked data points.

After processing all files, print a summary table: file path | what changed.
