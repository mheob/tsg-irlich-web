---
name: create-commit
description: Create a standardized Conventional Commits git commit from the current diff. Use when the user asks to commit, create a commit, or invokes /create-commit.
user-invocable: true
allowed-tools: Bash
agent: git-versioning
---

## Overview

Create standardized, semantic git commits using the Conventional Commits specification. Analyze the actual diff to determine appropriate type, scope, and message.

## Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Purpose                        |
| ---------- | ------------------------------ |
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `docs`     | Documentation only             |
| `style`    | Formatting/style (no logic)    |
| `refactor` | Code refactor (no feature/fix) |
| `perf`     | Performance improvement        |
| `test`     | Add/update tests               |
| `build`    | Build system/dependencies      |
| `ci`       | CI/config changes              |
| `chore`    | Maintenance/misc               |
| `revert`   | Revert commit                  |

## Breaking Changes

```
# Exclamation mark after type/scope
feat!: remove deprecated endpoint

# BREAKING CHANGE footer
feat: allow config to extend other configs

BREAKING CHANGE: `extends` key behavior changed
```

## Workflow

Use the `gitbutler` SKILL to create commits.

## Best Practices

- One logical change per commit
- Description: imperative mood, lowercase first letter, no period at end, max 50 characters inclusive type and scope
- Body: explain **what** and **why**, not **how**. Wrap at 72 characters.
- Reference issues: `Closes #123`, `Refs #456`

## Git Safety Protocol

- NEVER update git config
- NEVER run destructive commands (--force, hard reset) without explicit request
- NEVER skip hooks (--no-verify) unless user asks
- NEVER force push to main/master/develop
