import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { EchoArchive } from './_shared/echo-archive';
import { getEchoArchiveMetadata } from './_shared/echo-archive-metadata';
import EchoArchivePage, { generateMetadata } from './page';

vi.mock(import('./_shared/echo-archive'), () => ({ EchoArchive: vi.fn() }));
vi.mock(import('./_shared/echo-archive-metadata'), () => ({ getEchoArchiveMetadata: vi.fn() }));

describe('tsg-echo archive page', () => {
	afterEach(() => {
		vi.mocked(getEchoArchiveMetadata).mockReset();
	});

	// WEB-415: the route reads no search parameters, which would render it on every request.
	it('shows the first page', () => {
		const page = EchoArchivePage();

		expect(page.type).toBe(EchoArchive);
		expect(page.props).toStrictEqual({ currentPage: 1 });
	});

	it('describes the first page', async () => {
		vi.mocked(getEchoArchiveMetadata).mockResolvedValue({ title: 'TSG-Echo' });

		await expect(generateMetadata()).resolves.toStrictEqual({ title: 'TSG-Echo' });
		expect(getEchoArchiveMetadata).toHaveBeenCalledWith(1);
	});
});
