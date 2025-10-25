---
description: Create a Pull Request
allowed-tools: Bash(git*), Bash(gh*)
---

## Context

- Current branch: !`git branch --show-current`
- Base branch: !`git rev-parse --abbrev-ref HEAD@{upstream}`
- Commits to be included: !`git log --oneline origin/main..HEAD`
- Changed files: !`git diff --name-only origin/main..HEAD`
- Current repository: !`git remote get-url origin`

## Your tasks

Create a Pull Request with:

- Title as conventional commit (max 50 chars)
- Description organized in "Summary", "Changes", "Motivation"
- Appropriate labels based on scope
- Proper reviewer assignment

## PR Description Template

### Summary

Brief description of what this PR accomplishes (1-2 sentences)

### Changes

- List of specific changes made
- Include file paths and what was modified
- Mention any new features, bug fixes, or improvements

### Motivation

- Why was this change necessary?
- What problem does it solve?
- Any related issues or discussions

## Label Guidelines

Get the latest labels from GitHub and choose the one that suits you best.

## Scope Guidelines

- Use scopes like: `web`, `studio`, `deps`, `config`, `docs`
- Examples: `feat(web): add new component`, `fix(studio): update schema`
