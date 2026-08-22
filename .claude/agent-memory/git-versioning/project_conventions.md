---
name: Project git and PR conventions
description: Key branching, PR, and commit conventions for mheob/tsg-irlich-web
type: project
---

- **Main/base branch**: `next` (not `main` or `develop`)
- **Remote**: GitHub at `github.com:mheob/tsg-irlich-web.git`
- **Commit tool**: Commitizen (`pnpm run commit`) with czg; conventional commits enforced by commitlint
- **Common scopes**: `deps`, `release`, `repo`, `ai`, `manual`, `self-service`, `training`, `zis`, `web`, `scripts`
- **Pre-commit hooks**: Lefthook (`lefthook.yml`) runs `oxfmt` and `oxlint --fix` on staged files
- **PR labels (exact names with emoji)**: `enhancement ✨`, `tools 🔧`, `bug 🐛`, `documentation 📝`, `deps 📦`, `studio 🗃️`, `frontend 🖥️`, `chore` (no emoji)
