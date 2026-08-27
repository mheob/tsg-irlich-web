import { describe, expect, it, vi } from 'vitest';

import type { MembershipPageQueryResult } from '@/types/sanity.types.generated';

import { renderWithUser } from '../../../../test-utils/render';
import { Downloads } from './downloads';

// The download URL is built from the Sanity asset, which reaches `src/lib/sanity/api.ts` — and
// that asserts its project variables at import time. `vi.hoisted` runs before the imports are
// evaluated; `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

type DownloadsSection = NonNullable<MembershipPageQueryResult['membership']>['downloadsSection'];

function buildSection(downloads: unknown[]): DownloadsSection {
	// The generated type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		downloads,
		intro: 'Alles zum Mitnehmen.',
		subtitle: 'Downloads',
		title: 'Formulare',
	} as unknown as DownloadsSection;
}

function download(key: string, asset?: unknown) {
	const document = {
		asset: asset ?? {
			originalFilename: `${key}.pdf`,
			size: 2048,
			url: `https://cdn.example/${key}`,
		},
	};
	return { _key: key, document, title: `Formular ${key}` };
}

describe('the downloads section', () => {
	it('heads the section with its title and introduction', () => {
		const { getByRole, getByText } = renderWithUser(
			<Downloads {...buildSection([download('beitritt')])} />,
		);

		expect(getByRole('heading', { name: 'Formulare' })).not.toBeNull();
		expect(getByText('Alles zum Mitnehmen.')).not.toBeNull();
	});

	it('offers each document as a labelled download', () => {
		const { getByRole } = renderWithUser(<Downloads {...buildSection([download('beitritt')])} />);

		const link = getByRole('link', { name: 'Das PDF "Formular beitritt" herunterladen' });

		expect(link.getAttribute('href')).toBe('https://cdn.example/beitritt?dl=beitritt.pdf');
	});

	it('shows the file size of a document', () => {
		const { getByText } = renderWithUser(<Downloads {...buildSection([download('beitritt')])} />);

		expect(getByText(/Dateigröße: 2\.0 KB/u)).not.toBeNull();
	});

	it('shows a dash for a document whose size is unknown', () => {
		const { getByText } = renderWithUser(
			<Downloads
				{...buildSection([
					download('beitritt', { originalFilename: 'x.pdf', url: 'https://cdn.example/x' }),
				])}
			/>,
		);

		expect(getByText(/Dateigröße: —/u)).not.toBeNull();
	});

	it('renders no cards when the section carries no downloads', () => {
		const { queryAllByRole } = renderWithUser(<Downloads {...buildSection([])} />);

		expect(queryAllByRole('link')).toHaveLength(0);
	});
});
