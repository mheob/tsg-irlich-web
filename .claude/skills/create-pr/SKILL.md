---
name: create-pr
description: Create a Pull Request
user-invocable: true
allowed-tools: Bash(gh*), Bash(git*), Bash(bun run*)
agent: git-versioning
---

Create a Pull Request based on all commits in the current branch that differ from `develop`.

Check for an available changeset.

- the title is written as conventional commit with a max length of 50 characters
- the description is organized in "Summary", "Changes", "Motivation" and if useful any additional context

Make sure the description is clear and concise, and that it provides enough information for reviewers to understand the purpose
and impact of the changes.

Do not use the `--no-verify` if not really need.

Do not mention an co-author or generator.
