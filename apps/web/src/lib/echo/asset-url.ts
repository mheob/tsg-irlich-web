/** A Sanity file asset reference of a PDF: `file-<40 hex sha1>-pdf`. */
const FILE_ASSET_REF = /^file-[0-9a-f]{40}-pdf$/u;
const REF_PREFIX = 'file-';
const REF_SUFFIX = '-pdf';

/**
 * Builds the CDN url of a PDF from its asset reference. Only the hash comes from the reference;
 * host, project and dataset are fixed, so a crafted reference cannot make the server fetch
 * anything else (the spike's SSRF finding).
 *
 * @param pdfRef - The `_ref` of the PDF asset.
 * @param location - The project and dataset the web app reads from.
 * @returns The url, or `undefined` for anything that is not a PDF asset reference.
 */
function getPdfUrl(pdfRef: string, location: DatasetLocation): string | undefined {
	if (!FILE_ASSET_REF.test(pdfRef)) {
		return undefined;
	}
	const hash = pdfRef.slice(REF_PREFIX.length, -REF_SUFFIX.length);
	return `https://cdn.sanity.io/files/${location.projectId}/${location.dataset}/${hash}.pdf`;
}

interface DatasetLocation {
	dataset: string;
	projectId: string;
}

export { FILE_ASSET_REF, getPdfUrl };
export type { DatasetLocation };
