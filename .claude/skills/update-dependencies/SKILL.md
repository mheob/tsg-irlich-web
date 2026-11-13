---
name: update-dependencies
description: Use when the user asks to update, upgrade or bump the dependencies ("aktualisiere alle dependencies"), to refresh the pnpm catalog or the lockfile, to replace open Renovate PRs with one update, or invokes /update-dependencies.
user-invocable: true
---

# Update dependencies

## Overview

One round of updates is one Linear ticket, one branch, one PR into `next`, and it replaces the open Renovate PRs. Every version comes from a decision you can name: the newest **stable release on the `latest` dist-tag that is at least 24 hours old**. pnpm refuses anything younger (`minimumReleaseAge`, default one day; only `@mheob/*` is exempt), and the same rule applies to GitHub Actions, the Playwright image and Node.

## Quick reference

| What | Where it lives | How it moves |
| --- | --- | --- |
| npm packages | `catalog:` in `pnpm-workspace.yaml` | edit the `^x.y.z` by hand, then `pnpm install` |
| `vite`, `vite-plus`, `vitest`, `@vitest/coverage-v8` | catalog, top block | only `vp migrate`, never by hand |
| `next` | catalog **and** `overrides.next` | both together |
| Overrides | `overrides:` in `pnpm-workspace.yaml` | review every round, see step 6 |
| Playwright | catalog + image in `.github/workflows/e2e.yml`, `apps/web/scripts/update-screenshots.sh`, tag in `apps/web/AGENTS.md` | all together, image digest from MCR |
| Node patch | `.node-version` | alone; the `engines` ranges stay |
| Node minor/major | `.node-version`, `engines.node` in three `package.json`, `@types/node`, docs | see the root `AGENTS.md` (Deployment) |
| pnpm | `packageManager` in the root `package.json`, docs | then the `update-md-data` skill |
| GitHub Actions | SHA pins with a `# vX.Y.Z` comment in `.github/workflows/*.yml` | resolve the tag to its SHA |
| Snyk ignores | `apps/web/.snyk`, `apps/studio/.snyk`, `packages/email/.snyk` | review every round, see step 7 |

Prefix every shell command with `export PATH="$HOME/.local/share/vite-plus/bin:$PATH";`, otherwise `node`, `pnpm` and `vp` are not found.

## Steps

### 1. Ticket and branch

Create a Linear ticket in the team Website with the label `tools 🔧`, titled like its predecessors ("Dependencies aktualisieren (November 2026, zweite Runde)"). The description is German and names the predecessor, the rules above and the Renovate PRs it replaces; copy the shape of the last such ticket. Branch: `build/web-<id>-update-dependencies`. GitButler creates it on the first `but commit -b`.

### 2. Take stock

- `gh pr list --state open` shows the Renovate PRs. Their CI result is a free preview, for instance whether E2E passes in a new Playwright image.
- `pnpm outdated -r` applies the gate and hides what it refuses, so it cannot tell you what is held back. Write this script to the scratchpad instead and run it with `node <scratchpad>/catalog-ages.mjs pnpm-workspace.yaml`. It prints every entry with a newer `latest`, how old that release is, and the newest version that already clears the gate:

```js
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const STABLE = /^\d+\.\d+\.\d+$/;
const compare = (a, b) => {
	const [x, y] = [a, b].map((v) => v.split('.').map(Number));
	return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};
const yaml = readFileSync(process.argv[2], 'utf8');
const catalog = yaml.split('\ncatalog:\n')[1].split(/\n(?=\S)/)[0];
for (const line of catalog.split('\n')) {
	const m = line.match(/^\s+"?([^":#\s]+)"?:\s+(\S+)/);
	if (!m) continue;
	let [, name, spec] = m;
	let pkg = name;
	if (spec.startsWith('npm:'))
		[pkg, spec] = [spec.slice(4).replace(/@[^@]+$/, ''), spec.replace(/^.*@/, '')];
	const current = spec.replace(/^[\^~]/, '');
	const info = JSON.parse(
		execFileSync('pnpm', ['view', pkg, 'time', 'dist-tags', '--json'], { encoding: 'utf8' }),
	);
	const latest = info['dist-tags'].latest;
	if (latest === current) continue;
	const hours = (Date.now() - Date.parse(info.time[latest])) / 36e5;
	const cleared = Object.entries(info.time)
		.filter(
			([v, t]) => STABLE.test(v) && compare(v, latest) <= 0 && Date.now() - Date.parse(t) >= 864e5,
		)
		.map(([v]) => v)
		.sort(compare)
		.at(-1);
	console.log(
		`${name}\t${current}\tlatest=${latest} (${hours.toFixed(0)} h)\tpast the gate=${cleared}`,
	);
}
```

- Outside the catalog, check the same rule by hand:
  - **Actions:** list the tags with `gh api "repos/<owner>/<repo>/tags?per_page=5"` (`releases/latest` misses actions that tag every patch). A tag's age is when it was published: the release's `published_at` (`gh api repos/<owner>/<repo>/releases/tags/<tag> -q .published_at`), without a release the tagger date of an annotated tag. The commit date is no measure, because the commit is older than its tag.
  - **Node:** `curl -s https://nodejs.org/dist/index.json`, the `date` of the newest `v26.*`.
  - **pnpm:** only `pnpm view pnpm dist-tags.latest`. `next-12` and similar tags are previews, never a release.

A major update goes in only after reading its changelog, and only if typecheck, lint, tests and build stay green; otherwise it waits for a ticket of its own. Read the release notes of **every** Action bump, patches included: nothing in the repository tests a workflow, and actions ship breaking changes in patch releases. Name such a change in the PR.

If nothing clears the gate, stop here: tell the user what is waiting and when each version clears, and create no ticket.

### 3. Vite+

If `vite-plus` has a release past the gate: `vp migrate --no-interactive --no-agent --no-editor --no-hooks`. It re-pins the four toolchain entries. If it aborts with "Migration input changed" (an editor wrote a file meanwhile), run it again. It rewrites quotes in `pnpm-workspace.yaml`; `pnpm run format` puts them back.

### 4. Catalog and the places outside it

- Edit the remaining catalog ranges to `^<version past the gate>`. Do not run `pnpm update --latest`: it takes versions you have not decided on and refreshes transitive packages across the whole lockfile.
- Move `overrides.next` with the catalog's `next`.
- Playwright image digest: `curl -sI -H "Accept: application/vnd.oci.image.index.v1+json" https://mcr.microsoft.com/v2/playwright/manifests/v<version>-noble | grep -i docker-content-digest`.
- Action SHA: `gh api repos/<owner>/<repo>/commits/<tag> -q .sha`, and write the full version into the trailing comment of the pin you bump (`# v8.5.0`). Leave the comments of pins you do not bump as they are.
- `pnpm install`.

### 5. Fallout

- New oxlint rules arrive with Vite+. `pnpm run lint` must report 0 warnings, because the pre-push hook runs it with `--deny-warnings`.
- Sonar requires 80% coverage on new code. A line changed in an entry script that no test runs (`apps/studio/scripts/*.ts`) counts as uncovered: move the logic into a tested module next to it and leave only the call in the script.
- `pnpm run extract-types && pnpm run typegen:sanity` must leave the schema and the generated types unchanged after a Sanity update.

### 6. Overrides

For every entry under `overrides:`:

- `pnpm why <pkg> -r` shows who pulls it in. The ranges those dependents ask for are in their `package.json` under `node_modules/.pnpm/<dependent>@<version>/node_modules/<dependent>/`.
- If every dependent now asks for the fixed version itself, or nothing pulls the package any more, remove the override, its comment, and every doc line that names it (`git grep -n <pkg> -- ':!pnpm-lock.yaml'`, mostly `apps/web/AGENTS.md`). `pnpm install` again and confirm the resolved version did not drop.
- `pnpm run cve` reports transitive advisories. When a fixed version exists, raise the override and name the advisories in its comment. Look them up with `curl -s https://api.osv.dev/v1/query -d '{"package":{"name":"<pkg>","ecosystem":"npm"},"version":"<version>"}'`.
- An override that pushes a dependent outside its own range (`undici` ^7 under `jsdom` 31, which asks for ^8) is worth a note in the PR, not a change in this round: reworking it needs its own ticket and tests.

### 7. Snyk ignores

The Snyk CLI is not installed; never run it. For each ID in the three `.snyk` files:

- Fetch `https://security.snyk.io/vuln/<ID>` (curl with a browser user agent, the HTML into the scratchpad) and read "How to fix?", the "Affecting … versions" line and any "Amendment".
- Check `pnpm view <pkg> dist-tags.latest` and `pnpm why <pkg> -r` in the project the file belongs to.
- **Remove the ignore** when Snyk withdrew the advisory ("deemed not a vulnerability"), when a fixed version now resolves everywhere, or when the package is gone from that project.
- **Renew `expires`** to about one month ahead when the ignore is still needed and would expire within the next two weeks; an expired ignore fails the required Snyk check on every PR. Keep the reason text true.
- Commit the policy files separately (`chore(snyk): …`).

### 8. Verify

`pnpm run format:check`, `pnpm run knip`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:coverage`, `pnpm run build`, `pnpm peers check`, `pnpm run cve`. Run the script from step 2 again: everything still listed must be younger than a day.

The visual baselines only compare inside the Playwright container, so the `E2E` job is their check. Untracked files or applied branches of another session (`git status`, `but status`) can fail Knip or lint; leave them alone.

### 9. Commit and PR

- `pnpm run format:check` before every `but commit`, since GitButler skips the pre-commit hook. Then the `create-commit` skill; the subject is `build(deps): update dependencies`. Name your paths explicitly (`but commit -b <branch> -F - <path> <path> …`), so nothing another session left uncommitted lands in the commit.
- The `create-pr` skill, with base **`next`**, not `main`. The body is English and closes the ticket (`Closes WEB-<id>`). It lists the security fixes with their advisory IDs, the removed overrides and ignores with the reason, a **Held back** list of what the gate refused (version and age), which Renovate PRs it supersedes, and what was not run locally.
- Bind the PR and turn Auto-fix on. In Linear, attach the PR first and set "In Review" in a second, later call.

### 10. After the PR

- Auto-fix wakes the session on CI failures and review comments; do not poll CI or the merge.
- Kodiak squash-merges into `next` once the checks are green. Afterwards: `but status` (GitButler usually drops the merged branch on its own), the ticket on Done, its synced GitHub issue closed. Ask the user before closing a Renovate PR the merge superseded.

## Common mistakes

| Mistake | Instead |
| --- | --- |
| Taking a `next-*` dist-tag or a prerelease (`pnpm` 12.20.0 on `next-12`) | Only `dist-tags.latest` and stable versions below it |
| Judging an Action tag's age by its commit date | The release's `published_at`, else the tagger date; 24 hours like npm |
| Bumping an Action without reading its notes because it is a patch | Read every Action's release notes; name breaking changes in the PR |
| `pnpm update -r --latest` | Decide each version, edit the catalog, `pnpm install` |
| Bumping the Playwright image in the workflow only | Workflow, `update-screenshots.sh` and the guide together |
| Leaving overrides and Snyk ignores as they were | Review both every round, steps 6 and 7 |
| Polling CI or the merge after the PR | Auto-fix reports; nothing to poll |
| Reading Socket's `@sanity/ui 5.0.0-alpha.19 ⏵ 4.4.11` as a downgrade | The direct entry and a transitive alpha are two lockfile entries; compare `'@sanity/ui@` in both lockfiles |
