import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../../../test-utils/render';
import { Downloads } from './downloads';
import type { ArticleDownloads } from './downloads';

// The download URL is built from the Sanity asset, which reaches `src/lib/sanity/api.ts` — and
// that asserts its project variables at import time. `vi.hoisted` runs before the imports are
// evaluated; `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

function defaultAsset(key: string) {
	return { originalFilename: `${key}.pdf`, size: 2048, url: `https://cdn.example/${key}.pdf` };
}

function download(key: string, asset: unknown = defaultAsset(key)) {
	return { _key: key, document: { asset }, title: `Einladung ${key}` };
}

function buildDownloads(downloads: unknown[]): ArticleDownloads {
	// The generated type carries more fields than a fixture needs to name.
	return downloads as unknown as ArticleDownloads;
}

describe('the downloads below an article', () => {
	it('heads the list with its own title', () => {
		const { getByRole } = renderWithUser(
			<Downloads downloads={buildDownloads([download('jhv')])} />,
		);

		expect(getByRole('heading', { name: 'Downloads' })).not.toBeNull();
	});

	// WCAG 2.5.3 (Label in Name): the name starts with what the row shows, its title and file size.
	it('offers each document as a download named by its visible text', () => {
		const { getByRole } = renderWithUser(
			<Downloads downloads={buildDownloads([download('jhv')])} />,
		);

		const link = getByRole('link', { name: 'Einladung jhv PDF, 2,0 KB herunterladen' });

		expect(link.getAttribute('href')).toBe('https://cdn.example/jhv.pdf?dl=jhv.pdf');
	});

	it('lists the downloads in the order the editors put them', () => {
		const { getAllByRole } = renderWithUser(
			<Downloads downloads={buildDownloads([download('jhv'), download('flyer')])} />,
		);

		expect(getAllByRole('link').map((link) => link.getAttribute('href'))).toStrictEqual([
			'https://cdn.example/jhv.pdf?dl=jhv.pdf',
			'https://cdn.example/flyer.pdf?dl=flyer.pdf',
		]);
	});

	it('skips a download whose file cannot be resolved', () => {
		const { getAllByRole } = renderWithUser(
			<Downloads downloads={buildDownloads([download('broken', null), download('flyer')])} />,
		);

		expect(getAllByRole('link').map((link) => link.getAttribute('href'))).toStrictEqual([
			'https://cdn.example/flyer.pdf?dl=flyer.pdf',
		]);
	});

	it('renders nothing when the article carries no downloads', () => {
		const { container } = renderWithUser(<Downloads downloads={buildDownloads([])} />);

		expect(container.innerHTML).toBe('');
	});

	it('renders nothing when the article has never had downloads', () => {
		const { container } = renderWithUser(<Downloads downloads={null} />);

		expect(container.innerHTML).toBe('');
	});

	it('renders nothing when none of the downloads has a file', () => {
		const { container } = renderWithUser(
			<Downloads downloads={buildDownloads([download('broken', null)])} />,
		);

		expect(container.innerHTML).toBe('');
	});
});
