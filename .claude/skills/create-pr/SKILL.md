---
name: create-pr
description: Create a pull request against main on GitHub. Use when the user asks to create a PR, open a pull request, or ship the current branch.
user-invocable: true
allowed-tools: Bash
agent: git-versioning
---

Create a Pull Request based on all commits in the current branch that differ from `main`.

1. Ensure all changes are committed
2. Push the branch to the remote
3. Use the `gitbutler` SKILL to create the PR:
   1. Set the target branch to `main`
   2. Write a clear, descriptive title following conventional commit style, max 50 characters inclusive type and scope
   3. Include sections: **Summary**, **Changes**, **Motivation**, **Testing**, **Breaking Changes**
4. If the `gitbutler` command fails, try `gh`

Do not mention a co-author or generator.

## Git Safety Protocol

- NEVER update git config
- NEVER run destructive commands (--force, hard reset) without explicit request
- NEVER skip hooks (--no-verify) unless user asks
- NEVER force push to main/master/develop
