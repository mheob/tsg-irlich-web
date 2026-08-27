import { describe, expect, it, vi } from 'vitest';

import type { GroupDance, SimpleBlockContent } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../../test-utils/render';
import { Main } from './main';

// The gallery images go through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that
// asserts its project variables at import time. `vi.hoisted` runs before the imports are
// evaluated; `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function buildDescription(): SimpleBlockContent {
	// The generated type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		text: [
			{
				_key: 'block',
				_type: 'block',
				children: [{ _key: 'span', _type: 'span', marks: [], text: 'Wir trainieren dienstags.' }],
				markDefs: [],
				style: 'normal',
			},
		],
	} as unknown as SimpleBlockContent;
}

function buildGallery(count: number): GroupDance['images'] {
	// The generated type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return Array.from({ length: count }, (_unused, index) => ({
		_key: `image-${index + 1}`,
		alt: `Bild ${index + 1}`,
		asset: { _ref: ASSET_REF, _type: 'reference' },
	})) as unknown as GroupDance['images'];
}

describe('the main section of a group', () => {
	it('heads the section with the group title', () => {
		const { getByRole } = renderWithUser(
			<Main description={buildDescription()} gallery={buildGallery(0)} title="Herren 1" />,
		);

		expect(getByRole('heading', { level: 1, name: 'Herren 1' })).not.toBeNull();
	});

	it('renders the description of the group', () => {
		const { getByText } = renderWithUser(
			<Main description={buildDescription()} gallery={buildGallery(0)} title="Herren 1" />,
		);

		expect(getByText('Wir trainieren dienstags.')).not.toBeNull();
	});

	it('shows the gallery images of the group', () => {
		const { getByRole } = renderWithUser(
			<Main description={buildDescription()} gallery={buildGallery(2)} title="Herren 1" />,
		);

		expect(getByRole('img', { name: 'Bild 1' })).not.toBeNull();
		expect(getByRole('img', { name: 'Bild 2' })).not.toBeNull();
	});
});
