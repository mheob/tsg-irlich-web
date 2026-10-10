/**
 * Loads a PDF from the Sanity CDN.
 *
 * @param url - A url built by `getPdfUrl`, never one taken from a request.
 * @returns The PDF's bytes.
 * @throws {Error} With the HTTP status when the CDN does not answer with 2xx.
 */
async function downloadPdf(url: string): Promise<Uint8Array> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Die PDF konnte nicht geladen werden (HTTP ${response.status}).`);
	}
	return new Uint8Array(await response.arrayBuffer());
}

export { downloadPdf };
