import { describe, expect, it, vi } from 'vite-plus/test';

import type { AnyImage } from '@/types/sanity.types';
import { OFFER_FALLBACK_IMAGE } from '@/utils/fallback-image';

import { renderWithUser } from '../../../test-utils/render';
import { GroupCard } from './group-card';

// The card falls back to `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that asserts
// its project variables at import time. `vi.hoisted` runs before the imports are evaluated;
// `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

const IMAGE_WITH_ASSET: AnyImage = {
	_type: 'extendedImage',
	alt: 'Fußball',
	asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
};

const IMAGE_WITHOUT_ASSET: AnyImage = { _type: 'extendedImage', alt: 'Fußball' };

describe('the group card', () => {
	it('links to the given href', () => {
		const { getByRole } = renderWithUser(
			<GroupCard href="/angebot/fussball" icon="Fussball" title="Fußball" />,
		);

		expect(getByRole('link', { name: 'Mehr über "Fußball" erfahren' }).getAttribute('href')).toBe(
			'/angebot/fussball',
		);
	});

	it('prefers the overview title over the title', () => {
		const { getByRole } = renderWithUser(
			<GroupCard
				href="/angebot/fussball/herren-1"
				icon="Fussball"
				overviewTitle="Erste Herren"
				title="Herren 1"
			/>,
		);

		expect(getByRole('heading', { name: 'Erste Herren' })).not.toBeNull();
	});

	it('shows the title as the image alternative text', () => {
		const { getByRole } = renderWithUser(
			<GroupCard href="/angebot/fussball/herren-1" icon="Fussball" title="Herren 1" />,
		);

		expect(getByRole('img', { name: 'Herren 1' })).not.toBeNull();
	});

	it('shows the image from Sanity when it has an asset', () => {
		const { getByRole } = renderWithUser(
			<GroupCard href="/angebot/fussball" image={IMAGE_WITH_ASSET} title="Fußball" />,
		);

		expect(
			getByRole('img', { name: 'Fußball' })
				.getAttribute('src')
				?.startsWith('https://cdn.sanity.io/images/test-project/test-dataset/abc123-800x600.jpg'),
		).toBe(true);
	});

	it.each([
		['has no asset', IMAGE_WITHOUT_ASSET],
		['is null', null],
		['is missing', undefined],
	])('shows the fallback image when the image %s', (_name, image) => {
		const { getByRole } = renderWithUser(
			<GroupCard href="/angebot/fussball" image={image} title="Fußball" />,
		);

		expect(getByRole('img', { name: 'Fußball' }).getAttribute('src')).toBe(
			OFFER_FALLBACK_IMAGE.src.src,
		);
	});

	it.each([
		['missing', undefined],
		['null', null],
	])('renders nothing for a card whose title is %s', (_name, title) => {
		const { container } = renderWithUser(
			<GroupCard href="/angebot/fussball" icon="Fussball" title={title} />,
		);

		expect(container.textContent).toBe('');
	});
});
