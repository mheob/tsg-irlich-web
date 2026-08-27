import { describe, expect, it, vi } from 'vitest';

import type { AboutUs } from '@/types/sanity.types';

import { renderWithUser } from '../../../../test-utils/render';
import { Intro } from './intro';

// The gallery images go through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that
// asserts its project variables at import time. `vi.hoisted` runs before the imports are
// evaluated; `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

type IntroContent = NonNullable<AboutUs['content']['introSection']>;

function image(key: string) {
	return { _key: key, alt: `Bild ${key}`, asset: { _ref: ASSET_REF, _type: 'reference' } };
}

function buildContent(images: unknown[]): IntroContent {
	// The generated type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		images,
		intro: { text: [{ _key: 'intro', _type: 'block' }] },
		subtitle: 'Der Verein',
		title: 'Wer wir sind',
	} as unknown as IntroContent;
}

describe('the introduction of the about us page', () => {
	it('heads the section with its title', () => {
		const { getByRole } = renderWithUser(<Intro content={buildContent([image('one')])} />);

		expect(getByRole('heading', { name: 'Wer wir sind' })).not.toBeNull();
	});

	it('shows the first image large and the rest below it', () => {
		const { getByRole } = renderWithUser(
			<Intro content={buildContent([image('one'), image('two'), image('three')])} />,
		);

		expect(getByRole('img', { name: 'Bild one' })).not.toBeNull();
		expect(getByRole('img', { name: 'Bild two' })).not.toBeNull();
		expect(getByRole('img', { name: 'Bild three' })).not.toBeNull();
	});

	it('renders nothing without images', () => {
		const { container } = renderWithUser(<Intro content={buildContent([])} />);

		expect(container.textContent).toBe('');
	});

	it('renders nothing when the first image cannot be resolved', () => {
		const { container } = renderWithUser(
			<Intro content={buildContent([{ _key: 'broken', alt: 'Kaputt' }])} />,
		);

		expect(container.textContent).toBe('');
	});
});
