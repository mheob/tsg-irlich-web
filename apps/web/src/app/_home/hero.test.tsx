import { within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vite-plus/test';

import type { SocialMediaQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { Hero } from './hero';

function buildSocialMedia(fields: Record<string, string>): SocialMediaQueryResult {
	// The generated result type carries the document meta fields as well.
	return fields as unknown as SocialMediaQueryResult;
}

const HERO_IMAGE = {
	alt: 'Eine Taekwondo-Sportlerin, eine Tänzerin und ein Fußballer der TSG Irlich',
	src: 'https://cdn.sanity.io/images/test-project/test-dataset/home-1394x2000.webp',
};

function renderHero(
	socialMedia: SocialMediaQueryResult = null,
	image: ComponentProps<typeof Hero>['image'] = HERO_IMAGE,
) {
	return renderWithUser(
		<Hero
			image={image}
			intro="Bei der TSG Irlich ist für jeden etwas dabei."
			socialMedia={socialMedia}
			subtitle="Mit Tradition und Leidenschaft seit 1882"
			title="Mehr als Sport – wir sind die TSG Irlich."
		/>,
	);
}

describe('the hero of the home page', () => {
	it('heads the page with the title, the subtitle and the intro', () => {
		const { getByRole, getByText } = renderHero();

		expect(
			getByRole('heading', { level: 1, name: 'Mehr als Sport – wir sind die TSG Irlich.' }),
		).not.toBeNull();
		expect(getByText('Mit Tradition und Leidenschaft seit 1882')).not.toBeNull();
		expect(getByText('Bei der TSG Irlich ist für jeden etwas dabei.')).not.toBeNull();
	});

	it('shows the athletes of the club in a single, described photo', () => {
		const { getAllByRole } = renderHero();

		const images = getAllByRole('img', {
			name: 'Eine Taekwondo-Sportlerin, eine Tänzerin und ein Fußballer der TSG Irlich',
		});

		expect(images).toHaveLength(1);
		expect(images[0]?.getAttribute('src')).toBe(HERO_IMAGE.src);
	});

	it('shows no photo without one', () => {
		const { queryByRole } = renderWithUser(
			<Hero socialMedia={null} subtitle="Seit 1882" title="Die TSG Irlich" />,
		);

		expect(queryByRole('img')).toBeNull();
	});

	// The cut-out stands on the bottom edge; a hotspot must not lift it off.
	it('does not move the cut-out by a hotspot', () => {
		// The page hands over the hero image of a single page, which carries the hotspot position.
		const imageWithHotspot = { ...HERO_IMAGE, objectPosition: '25% 75%' };
		const { getByRole } = renderHero(null, imageWithHotspot);

		expect(
			(getByRole('img', { name: HERO_IMAGE.alt }) as HTMLImageElement).style.objectPosition,
		).toBe('');
	});

	it('links the call to action to the contact page', () => {
		const { getByRole } = renderHero();

		expect(getByRole('link', { name: 'Kontakt aufnehmen' }).getAttribute('href')).toBe('/kontakt');
	});

	it('lists one link per channel in its own social media navigation', () => {
		const { getByRole } = renderHero(
			buildSocialMedia({
				facebook: 'https://facebook.example',
				instagram: 'https://instagram.example',
			}),
		);

		const navigation = getByRole('navigation', { name: 'Social Media' });

		expect(within(navigation).getAllByRole('button')).toHaveLength(2);
		expect(within(navigation).getByRole('button', { name: 'facebook' })).not.toBeNull();
		expect(within(navigation).getByRole('button', { name: 'instagram' })).not.toBeNull();
	});
});
