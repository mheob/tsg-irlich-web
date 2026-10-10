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

/** `/echo-archiv/<kind>/<file>`: one asset of one kind, with a plain file name. */
const ARCHIVE_ASSET_PATH = /^\/echo-archiv\/(?<kind>images|files)\/(?<file>[\w-]+\.[a-z0-9]+)$/u;

/**
 * The Sanity CDN URL behind an archive path, so the proxy can hand the request on.
 *
 * @param pathname - The requested path.
 * @param search - The requested query string, `?` included, or an empty string.
 * @param target - The Sanity project and dataset the website reads.
 * @param target.dataset - The dataset.
 * @param target.projectId - The project.
 * @returns The CDN URL, or `undefined` for anything that is not one archive asset.
 */
function toCdnUrl(
	pathname: string,
	search: string,
	{ dataset, projectId }: SanityTarget,
): string | undefined {
	const asset = ARCHIVE_ASSET_PATH.exec(pathname);
	if (!asset?.groups || !dataset || !projectId) {
		return undefined;
	}
	return `https://${SANITY_CDN_HOST}/${asset.groups.kind}/${projectId}/${dataset}/${asset.groups.file}${search}`;
}

interface SanityTarget {
	dataset?: string;
	projectId?: string;
}

/** What every archive response tells search engines. */
const ARCHIVE_ROBOTS_TAG = 'noindex, nofollow';

export { ARCHIVE_PATH, ARCHIVE_ROBOTS_TAG, toArchiveUrl, toCdnUrl };
export type { SanityTarget };
