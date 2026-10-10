import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createFetchMock } from '../../../test-utils/fetch-mock';
import { downloadPdf } from './download-pdf';

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
			'Die PDF konnte nicht geladen werden (HTTP 404).',
		);
	});
});
