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
 * The URL a visitor gets for an asset: the CDN's own, or the archive path's, which tells search
 * engines to stay away.
 *
 * `indexable` is the issue's own field, not a behaviour switch: two functions instead would split
 * every helper that links an asset, hence the NOSONAR for S2301.
 *
 * @param url - The CDN URL.
 * @param indexable - Whether search engines may find the issue.
 * @returns The URL to link.
 */
function linkAsset(url: string, indexable: boolean): string {
	return indexable ? url : toArchiveUrl(url); // NOSONAR
}

/** `<ARCHIVE_PATH>/<kind>/<file>`: one asset of one kind. */
const ARCHIVE_ASSET_PATH = new RegExp(
	`^${ARCHIVE_PATH}/(?<kind>images|files)/(?<file>[^/]+)$`,
	'u',
);

/**
 * The file names the proxy passes, per kind: the formats the archive links. The assets come from
 * the club's own origin, where an SVG or HTML file could run script.
 */
const ARCHIVE_FILES = {
	files: /^[\w-]+\.pdf$/iu,
	images: /^[\w-]+\.(?:jpe?g|png|webp)$/iu,
} as const;

/**
 * Tells the two asset kinds of the archive apart from anything else.
 *
 * @param kind - The kind segment of an archive path.
 * @returns Whether the archive serves that kind.
 */
function isArchiveKind(kind?: string): kind is keyof typeof ARCHIVE_FILES {
	return kind === 'files' || kind === 'images';
}

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
	const { file, kind } = ARCHIVE_ASSET_PATH.exec(pathname)?.groups ?? {};
	if (!file || !isArchiveKind(kind) || !ARCHIVE_FILES[kind].test(file) || !dataset || !projectId) {
		return undefined;
	}
	return `https://${SANITY_CDN_HOST}/${kind}/${projectId}/${dataset}/${file}${search}`;
}

interface SanityTarget {
	dataset?: string;
	projectId?: string;
}

/** What every archive response tells search engines. */
const ARCHIVE_ROBOTS_TAG = 'noindex, nofollow';

export { ARCHIVE_PATH, ARCHIVE_ROBOTS_TAG, linkAsset, toArchiveUrl, toCdnUrl };
export type { SanityTarget };
