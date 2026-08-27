import { describe, expect, it, vi } from 'vitest';

import type { SponsorsQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { Sponsors } from './sponsors';

// The sponsor logos go through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that
// asserts its project variables at import time. `vi.hoisted` runs before the imports are
// evaluated; `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function buildSponsors(overrides: Record<string, unknown>[] = []): SponsorsQueryResult {
	// The generated result type carries more fields than a fixture needs to name.
	return overrides as unknown as SponsorsQueryResult;
}

const LOGO = { asset: { _ref: ASSET_REF, _type: 'reference' } };

function sponsor(id: string, logo: unknown = LOGO) {
	return { _id: id, logo, name: `Sponsor ${id}` };
}

describe('the sponsors of the home page', () => {
	it('shows one logo per sponsor, named after the sponsor', () => {
		const { getByRole } = renderWithUser(
			<Sponsors sponsors={buildSponsors([sponsor('one'), sponsor('two')])} />,
		);

		expect(getByRole('img', { name: 'Sponsor one' })).not.toBeNull();
		expect(getByRole('img', { name: 'Sponsor two' })).not.toBeNull();
	});

	it('skips a sponsor without a logo', () => {
		const { queryAllByRole } = renderWithUser(
			<Sponsors sponsors={buildSponsors([sponsor('one', null), sponsor('two')])} />,
		);

		expect(queryAllByRole('img')).toHaveLength(1);
	});

	it('shows nothing when there are no sponsors', () => {
		const { queryAllByRole } = renderWithUser(<Sponsors sponsors={buildSponsors()} />);

		expect(queryAllByRole('img')).toHaveLength(0);
	});
});
