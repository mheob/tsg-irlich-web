import { settle } from '@tsgi-web/shared';

import { RenderError } from './render-error';

/** Generous for a magazine of a few dozen megabytes, but well inside the run's time budget. */
const DOWNLOAD_TIMEOUT_MS = 120_000;

/**
 * Loads a PDF from the Sanity CDN.
 *
 * @param url - A url built by `getPdfUrl`, never one taken from a request.
 * @param timeoutMs - How long the download may take before it is given up.
 * @returns The PDF's bytes.
 * @throws {RenderError} With the HTTP status when the CDN does not answer with 2xx, or when the
 *   download took too long.
 */
async function downloadPdf(url: string, timeoutMs = DOWNLOAD_TIMEOUT_MS): Promise<Uint8Array> {
	const signal = AbortSignal.timeout(timeoutMs);
	const response = await settle(fetch(url, { signal }));
	if (!response.ok) {
		throw signal.aborted
			? new RenderError('Die PDF konnte nicht rechtzeitig geladen werden.')
			: response.error;
	}
	if (!response.value.ok) {
		throw new RenderError(`Die PDF konnte nicht geladen werden (HTTP ${response.value.status}).`);
	}
	return new Uint8Array(await response.value.arrayBuffer());
}

export { downloadPdf };
