---
description: Create a git commit
allowed-tools: Bash(cat*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git status:*), Bash(pnpm changeset:*)
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`
- Commitlint rules: @commitlint.config.js

## Your tasks

- Create a single git commit based on the changes

## Scope Guidelines

- Use scopes like: `web`, `studio`, `deps`, `release`, `config`, `docs`
- Examples: `feat(web): add new component`, `fix(studio): update schema`

## Commit Message Format

- Type: feat, fix, docs, style, refactor, test, chore
- Scope: (optional) affected package/area
- Description: imperative mood, max 50 chars incl. type and scope
- Body: (optional) detailed explanation
- Footer: (optional) breaking changes, issue references
