import { describe, expect, it, vi } from 'vitest';

import type { ImageCard } from '@/types/sanity.types';

import { renderWithUser } from '../../../../test-utils/render';
import { ChronicleCard } from './chronicle-card';

// The image goes through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that asserts
// its project variables at import time. `vi.hoisted` runs before the imports are evaluated;
// `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

const CHRONICLE_IMAGE = { alt: 'Die Gründer', asset: { _ref: ASSET_REF } };

function buildCategory(image: unknown = CHRONICLE_IMAGE): ImageCard {
	// The generated type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		_key: 'gruendung',
		description: {
			text: [
				{
					_key: 'block',
					_type: 'block',
					children: [{ _key: 'span', _type: 'span', marks: [], text: 'Gegründet 1889.' }],
					markDefs: [],
					style: 'normal',
				},
			],
		},
		excerpt: 'Wie alles begann.',
		image,
		title: 'Gründung',
	} as unknown as ImageCard;
}

describe('a chronicle card', () => {
	it('shows its title and excerpt', () => {
		const { getByRole, getByText } = renderWithUser(<ChronicleCard category={buildCategory()} />);

		expect(getByRole('heading', { name: 'Gründung' })).not.toBeNull();
		expect(getByText('Wie alles begann.')).not.toBeNull();
	});

	it('shows the image of a card that has one', () => {
		const { getByRole } = renderWithUser(<ChronicleCard category={buildCategory()} />);

		expect(getByRole('img', { name: 'Die Gründer' })).not.toBeNull();
	});

	it('leaves the image out when the card has none', () => {
		const { queryByRole } = renderWithUser(<ChronicleCard category={buildCategory(null)} />);

		expect(queryByRole('img')).toBeNull();
	});

	it('reveals the full text in a dialog', async () => {
		const { findByText, getByRole, user } = renderWithUser(
			<ChronicleCard category={buildCategory()} />,
		);

		await user.click(getByRole('button', { name: /Mehr erfahren/u }));

		await expect(findByText('Gegründet 1889.')).resolves.not.toBeNull();
	});
});
