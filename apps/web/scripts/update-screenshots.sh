#!/usr/bin/env bash
set -euo pipefail

# Regenerates the visual regression baselines.
#
# A screenshot is only comparable against the platform that produced it, and CI compares inside the
# pinned Playwright container on an amd64 runner. This reproduces that environment exactly — same
# image, same architecture, same Node version — so the baselines it writes are the ones CI matches.
#
# On Apple Silicon the amd64 container is emulated and the run takes a while; that is the price of a
# baseline that means something. The repository is bind-mounted, but every directory a Linux install
# would otherwise overwrite — the workspace `node_modules` trees and the Next.js build output — is a
# named volume, so the host's macOS install stays untouched and the second run starts warm.
#
# Any arguments go to Playwright in place of the default `--update-snapshots`, which only rewrites a
# baseline that fails its comparison. A change smaller than `maxDiffPixelRatio` passes, so its
# baseline stays as it was; `--update-snapshots=all` rewrites every one.

readonly IMAGE='mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579'
readonly VOLUME_PREFIX='tsg-irlich-e2e'
# `pwuser` is the image's own unprivileged account and the same UID the CI job runs as, so Chromium
# keeps its sandbox in both places.
readonly CONTAINER_UID='1001'

if ! docker info > /dev/null 2>&1; then
	echo 'Docker is not running. Start it (OrbStack, Docker Desktop, …) and try again.' >&2
	exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"

# Every path a Linux install writes to, mapped onto a named volume of its own.
container_paths=(
	'/home/pwuser'
	'/work/node_modules'
	'/work/apps/studio/node_modules'
	'/work/apps/web/.next'
	'/work/apps/web/node_modules'
	'/work/packages/email/node_modules'
	'/work/packages/shared/node_modules'
)

volume_args=()
for container_path in "${container_paths[@]}"; do
	volume_name="${VOLUME_PREFIX}$(echo "${container_path}" | tr '/.' '--')"
	volume_args+=(--volume "${volume_name}:${container_path}")
done

# Docker creates a fresh named volume owned by root, which `pwuser` cannot write to. Handing them
# over once costs nothing on the runs where it has already happened.
docker run --rm --platform linux/amd64 --user root \
	"${volume_args[@]}" \
	--entrypoint chown \
	"${IMAGE}" \
	--recursive "${CONTAINER_UID}:${CONTAINER_UID}" "${container_paths[@]}"

exec docker run --rm --init \
	--platform linux/amd64 \
	--ipc=host \
	--user "${CONTAINER_UID}" \
	--env HOME=/home/pwuser \
	--workdir /work \
	--volume "${repo_root}:/work" \
	"${volume_args[@]}" \
	"${IMAGE}" \
	bash -euc '
		# The image ships its own Node, which is not the version `.node-version` pins and CI installs. It
		# is unpacked into the home volume once and reused from there afterwards.
		node_version="$(tr -d "v[:space:]" < /work/.node-version)"
		node_dir="${HOME}/.node/${node_version}"

		if [ ! -x "${node_dir}/bin/node" ]; then
			mkdir -p "${node_dir}"
			# The gzip tarball, not the smaller xz one: the image ships no `xz`.
			curl -fsSL "https://nodejs.org/dist/v${node_version}/node-v${node_version}-linux-x64.tar.gz" \
				| tar -xz -C "${node_dir}" --strip-components=1
		fi

		export PATH="${node_dir}/bin:${PATH}"

		# pnpm in the version `packageManager` pins, as `pnpm/action-setup` installs it in CI. Node
		# stopped shipping Corepack with version 25, so npm installs it into the home volume, once per
		# version. A hash after the version (`pnpm@x.y.z+sha512.…`) is not part of it.
		pnpm_version="$(node -p "require(\"/work/package.json\").packageManager.split(\"@\")[1].split(\"+\")[0]")"
		pnpm_dir="${HOME}/.pnpm/${pnpm_version}"

		if [ ! -x "${pnpm_dir}/bin/pnpm" ]; then
			npm install --global --prefix "${pnpm_dir}" --no-audit --no-fund "pnpm@${pnpm_version}"
		fi

		export PATH="${pnpm_dir}/bin:${PATH}"

		# The store lives in the home volume, set in the global pnpm config there rather than as a flag
		# of the install: `pnpm run` and `pnpm exec` check the install first and refuse a store other
		# than the one the dependencies are linked from (ERR_PNPM_UNEXPECTED_STORE). pnpm 11 reads no
		# `npm_config_store_dir`. Without the setting pnpm puts the store next to the project root,
		# which is the bind-mounted working tree — a 500 MB directory appearing in `git status` on the
		# host. `.gitignore` covers it as well, so a leak can never be committed.
		pnpm config set --location global store-dir "${HOME}/.pnpm-store"
		pnpm install --frozen-lockfile --ignore-scripts
		pnpm --filter web run typegen:routes
		# The image optimizer keeps its results in `.next/cache/images`, which lives in a named volume
		# and outlasts the build. CI starts without it, so a baseline taken from an image the mocks no
		# longer serve could never be matched there.
		rm -rf /work/apps/web/.next/cache/images
		# Not `pnpm run … -- --update-snapshots`: the separator is forwarded verbatim, and Playwright
		# reads everything after it as a positional test filter instead of as a flag.
		pnpm --filter web exec playwright test --grep @visual "$@"
	' bash "${@:---update-snapshots}"
