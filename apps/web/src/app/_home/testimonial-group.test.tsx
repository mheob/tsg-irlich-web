import { describe, expect, it, vi } from 'vitest';

import type { HomePageTestimonialsQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { TestimonialGroup } from './testimonial-group';

// The portraits go through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that asserts
// its project variables at import time. `vi.hoisted` runs before the imports are evaluated;
// `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function testimonial(id: string, image?: unknown) {
	const portrait = image === undefined ? { alt: `Foto ${id}`, asset: { _ref: ASSET_REF } } : image;
	return {
		_id: id,
		firstName: 'Ada',
		image: portrait,
		lastName: id,
		quote: `Zitat von ${id}`,
		role: 'Mitglied',
	};
}

function buildTestimonials(entries: unknown[]): NonNullable<HomePageTestimonialsQueryResult> {
	// The generated result type carries more fields than a fixture needs to name.
	return entries as unknown as NonNullable<HomePageTestimonialsQueryResult>;
}

describe('the testimonial group', () => {
	it('shows the name, role and quote of every testimonial', () => {
		const { getByText } = renderWithUser(
			<TestimonialGroup testimonials={buildTestimonials([testimonial('eins')])} />,
		);

		expect(getByText('Ada eins')).not.toBeNull();
		expect(getByText('Mitglied')).not.toBeNull();
		expect(getByText('Zitat von eins')).not.toBeNull();
	});

	it('shows the portrait of a testimonial that has one', () => {
		const { getByRole } = renderWithUser(
			<TestimonialGroup testimonials={buildTestimonials([testimonial('eins')])} />,
		);

		expect(getByRole('img', { name: 'Foto eins' })).not.toBeNull();
	});

	it('falls back to the initials when there is no portrait', () => {
		const { getByText, queryByRole } = renderWithUser(
			<TestimonialGroup testimonials={buildTestimonials([testimonial('eins', null)])} />,
		);

		expect(queryByRole('img')).toBeNull();
		expect(getByText('AE')).not.toBeNull();
	});

	it('renders one entry per testimonial', () => {
		const { getAllByRole } = renderWithUser(
			<TestimonialGroup
				testimonials={buildTestimonials([
					testimonial('eins'),
					testimonial('zwei'),
					testimonial('drei'),
				])}
			/>,
		);

		expect(getAllByRole('article')).toHaveLength(3);
	});
});
