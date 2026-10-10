// Imported by `next.config.ts`, so it uses relative imports only and nothing server-only.

/** The path the website serves Sanity assets under when search engines must not index them. */
const ARCHIVE_PATH = '/echo-archiv';

const SANITY_CDN_HOST = 'cdn.sanity.io';

/** `/<kind>/<project>/<dataset>/<file>` on the Sanity CDN. */
const CDN_ASSET_PATH = /^\/(?<kind>images|files)\/[^/]+\/[^/]+\/(?<file>[^/]+)$/u;

/**
 * Moves a Sanity CDN asset URL below the archive path, where the website serves it with
 * `X-Robots-Tag: noindex`. Anything that is not a CDN asset comes back unchanged.
 *
 * @param url - The asset URL as the image builder or the PDF projection returns it.
 * @returns The same-origin archive URL with the original parameters, or `url` itself.
 */
function toArchiveUrl(url: string): string {
	if (!URL.canParse(url)) {
		return url;
	}
	const parsed = new URL(url);
	const asset = parsed.hostname === SANITY_CDN_HOST ? CDN_ASSET_PATH.exec(parsed.pathname) : null;
	if (!asset?.groups) {
		return url;
	}
	return `${ARCHIVE_PATH}/${asset.groups.kind}/${asset.groups.file}${parsed.search}`;
}

/**
 * The external rewrite that proxies the archive path to the Sanity CDN. On Vercel the CDN does the
 * proxying, so the response size limit of functions does not apply.
 *
 * @param target - The Sanity project and dataset; without either there is nothing to proxy to.
 * @param target.dataset - The dataset the website reads.
 * @param target.projectId - The Sanity project.
 * @returns The rewrite, or none.
 */
function getArchiveRewrites({ dataset, projectId }: SanityTarget): ArchiveRewrite[] {
	if (!dataset || !projectId) {
		return [];
	}
	return [
		{
			destination: `https://${SANITY_CDN_HOST}/:kind/${projectId}/${dataset}/:file`,
			source: `${ARCHIVE_PATH}/:kind(images|files)/:file`,
		},
	];
}

/**
 * The headers of every archive response. `x-vercel-enable-rewrite-caching` opts projects created
 * before 2026-04-06 into caching external rewrites.
 *
 * @returns The header rule for the archive path.
 */
function getArchiveHeaders(): ArchiveHeaders[] {
	return [
		{
			headers: [
				{ key: 'X-Robots-Tag', value: 'noindex, nofollow' },
				{ key: 'x-vercel-enable-rewrite-caching', value: '1' },
			],
			source: `${ARCHIVE_PATH}/:path*`,
		},
	];
}

interface SanityTarget {
	dataset?: string;
	projectId?: string;
}

interface ArchiveRewrite {
	destination: string;
	source: string;
}

interface ArchiveHeaders {
	headers: { key: string; value: string }[];
	source: string;
}

export { ARCHIVE_PATH, getArchiveHeaders, getArchiveRewrites, toArchiveUrl };
export type { ArchiveHeaders, ArchiveRewrite };
