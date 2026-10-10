import { once } from 'node:events';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createFetchMock } from '../../../test-utils/fetch-mock';
import { downloadPdf } from './download-pdf';
import { RenderError } from './render-error';

/**
 * A `fetch` that never answers and only gives up when its signal aborts.
 *
 * @param _url - Ignored.
 * @param init - Carries the signal.
 * @returns Never resolves.
 */
async function waitForAbort(_url: unknown, init?: RequestInit): Promise<Response> {
	await once(init?.signal ?? new EventTarget(), 'abort');
	throw new Error('aborted');
}

describe('pdf download', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
	});

	it('returns the body as bytes', async () => {
		mock = createFetchMock();
		mock.enqueue({ body: '%PDF-1.7', status: 200 });

		const bytes = await downloadPdf('https://cdn.sanity.io/files/p/d/x.pdf');

		expect(new TextDecoder().decode(bytes)).toBe('%PDF-1.7');
		expect(mock.calls[0]?.url).toBe('https://cdn.sanity.io/files/p/d/x.pdf');
	});

	it('names the http status when the CDN refuses', async () => {
		mock = createFetchMock();
		mock.enqueue({ body: 'Not Found', status: 404 });

		await expect(downloadPdf('https://cdn.sanity.io/files/p/d/x.pdf')).rejects.toThrow(
			new RenderError('Die PDF konnte nicht geladen werden (HTTP 404).'),
		);
	});

	// A CDN that never answers would hold the run until the platform kills it, leaving it pending.
	it('gives up on a download that does not answer', async () => {
		const hanging = vi.spyOn(globalThis, 'fetch').mockImplementation(waitForAbort);

		await expect(downloadPdf('https://cdn.sanity.io/files/p/d/x.pdf', 10)).rejects.toThrow(
			new RenderError('Die PDF konnte nicht rechtzeitig geladen werden.'),
		);
		hanging.mockRestore();
	});

	it('passes a network error on as it is', async () => {
		const failure = new TypeError('fetch failed');
		const broken = vi.spyOn(globalThis, 'fetch').mockRejectedValue(failure);

		await expect(downloadPdf('https://cdn.sanity.io/files/p/d/x.pdf')).rejects.toBe(failure);
		broken.mockRestore();
	});
});
