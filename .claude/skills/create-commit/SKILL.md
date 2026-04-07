---
name: create-commit
description: Create a git commit
user-invocable: true
allowed-tools: Bash(cat*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git status:*), Bash(pnpm changeset:*)
agent: git-versioning
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your tasks

- make a feature branch is active
- create changeset for each commit (at least an empty one, if no changeset is needed); don't write the change message too short
- create a single git commit or multiple commits if it makes more sense based on the above changes

## Structure

Use the format: `<type>: <short summary>` (e.g., `feat: add user login flow)` Keep the subject line under 50 characters Add a
blank line between the subject and body if you need more detail Wrap body text at 72 characters

## Writing style

Use the imperative mood: "add feature" not "added feature" or "adds feature" Don't end the subject line with a period Be specific
— "fix null pointer in auth middleware" beats "fix bug"

### Conventional Commits (which fits well with your toolchain)

Common prefixes:

`feat`: — new feature `fix`: — bug fix `chore`: — maintenance, deps, config `docs`: — documentation only `refactor`: — no behavior
change `test`: — adding/updating tests `ci`: — CI/CD changes

Breaking changes get a `!` suffix: `feat!: redesign auth API`

### Scopes (optional)

Describe the area of the codebase affected by the change, e.g. `feat(auth): add login flow`

**Package scopes** (one per package):

- `oxfmt` — `@mheob/oxfmt-config`
- `oxlint` — `@mheob/oxlint-config`
- `internal` — `@mheob/internal`
- `tsconfig` — `@mheob/tsconfig`

**Cross-cutting scopes** (already used in git log):

- `repo` — monorepo-wide changes (tooling, structure)
- `deps` — dependency updates
- `release` — version bumps and publishing
- `vscode` / `zed` — editor config changes
- `scripts` — build/release scripts

### The body (when needed)

Explain why, not what — the diff already shows what changed. Answer: what problem does this solve? Are there side effects or
caveats?

## Practical tips

Each commit should represent one logical change — avoid "fix stuff and also update deps" If you need "and" in the subject, it's
probably two commits Reference issues where relevant: **fix(oxlint): add abc rule**

Do not use the `--no-verify` if not really need.

Do not mention a co-author or generator.
