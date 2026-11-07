import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { EchoArchive } from '../../_shared/echo-archive';
import { getEchoArchiveMetadata } from '../../_shared/echo-archive-metadata';
import EchoArchiveLaterPage, { generateMetadata, generateStaticParams } from './page';

vi.mock(import('../../_shared/echo-archive'), () => ({ EchoArchive: vi.fn() }));
vi.mock(import('../../_shared/echo-archive-metadata'), () => ({ getEchoArchiveMetadata: vi.fn() }));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

function routeProps(page: string): PageProps<'/verein/echo/seite/[page]'> {
	// `PageProps<'/verein/echo/seite/[page]'>` types the params as a promise.
	return { params: Promise.resolve({ page }) } as unknown as PageProps<'/verein/echo/seite/[page]'>;
}

describe('later page of the tsg-echo archive', () => {
	afterEach(() => {
		vi.mocked(getEchoArchiveMetadata).mockReset();
		vi.mocked(notFound).mockClear();
	});

	it('prerenders no page at build time, so every page is cached on its first request', () => {
		expect(generateStaticParams()).toStrictEqual([]);
	});

	it('shows the page the rewrite passes on', async () => {
		const page = await EchoArchiveLaterPage(routeProps('2'));

		expect(page.type).toBe(EchoArchive);
		expect(page.props).toStrictEqual({ currentPage: 2 });
	});

	it('describes that page', async () => {
		vi.mocked(getEchoArchiveMetadata).mockResolvedValue({ title: 'TSG-Echo' });

		await expect(generateMetadata(routeProps('2'))).resolves.toStrictEqual({ title: 'TSG-Echo' });
		expect(getEchoArchiveMetadata).toHaveBeenCalledWith(2);
	});

	it.each(['1', '02', 'abc'])('answers the segment %s with not found', async (segment) => {
		await expect(EchoArchiveLaterPage(routeProps(segment))).rejects.toThrow('NEXT_NOT_FOUND');
		await expect(generateMetadata(routeProps(segment))).rejects.toThrow('NEXT_NOT_FOUND');
		expect(getEchoArchiveMetadata).not.toHaveBeenCalled();
	});
});
