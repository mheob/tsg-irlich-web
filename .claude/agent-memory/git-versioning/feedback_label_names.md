---
name: GitHub label names include emoji
description: Labels on mheob/tsg-irlich-web include emoji suffixes in their names; using bare words like "enhancement" fails
type: feedback
---

Labels on this repo include emoji as part of the label name (e.g. `enhancement ✨`, `tools 🔧`, `bug 🐛`). Passing the plain word to `gh pr create --label` returns "label not found".

**Why:** The repo owner chose to include emoji in label names when setting up the repo.

**How to apply:** Before creating a PR, either run `gh label list` to confirm exact label names, or use names like `enhancement ✨`, `tools 🔧`, `documentation 📝`, `bug 🐛` which are known-good.
