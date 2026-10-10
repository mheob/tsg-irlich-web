/** A Sanity file asset reference of a PDF: `file-<40 hex sha1>-pdf`. */
const FILE_ASSET_REF = /^file-(?<hash>[0-9a-f]{40})-pdf$/u;

/**
 * Reads the SHA-1 out of a PDF asset reference.
 *
 * @param pdfRef - The `_ref` of the PDF asset.
 * @returns The 40 hex digits, or `undefined` for anything that is not a PDF asset reference.
 */
function getPdfHash(pdfRef: string): string | undefined {
	return FILE_ASSET_REF.exec(pdfRef)?.groups?.hash;
}

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
	const hash = getPdfHash(pdfRef);
	return hash
		? `https://cdn.sanity.io/files/${location.projectId}/${location.dataset}/${hash}.pdf`
		: undefined;
}

interface DatasetLocation {
	dataset: string;
	projectId: string;
}

export { FILE_ASSET_REF, getPdfHash, getPdfUrl };
export type { DatasetLocation };
