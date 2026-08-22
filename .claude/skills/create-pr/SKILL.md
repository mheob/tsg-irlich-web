---
name: create-pr
description: Create a Pull Request
user-invocable: true
allowed-tools: Bash(gh*), Bash(git*), Bash(pnpm run*)
agent: git-versioning
---

Create a Pull Request based on all commits in the current branch that differ from `next`.

1. Ensure all changes are committed
2. Push the branch to the remote
3. Use `gh` (GitHub CLI) to create the PR with:
   - A clear, descriptive title following conventional commit style with a max length of 50 characters
   - A thorough description that includes:
     - **Summary**: Summary of changes
     - **Changes**: Key technical changes made
     - **Motivation**: Why this change is needed (context/problem)
     - **Technical Approach**: Brief implementation details (if non-obvious)
     - **Testing**: How changes were verified
   - Set one or more labels

Make sure the description is clear and concise, and that it provides enough information for reviewers to understand the purpose and impact of the changes.

Do not use the `--no-verify` if not really need.

Do not mention an co-author or generator.
