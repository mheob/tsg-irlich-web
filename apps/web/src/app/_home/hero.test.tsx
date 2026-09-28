import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SocialMediaQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { Hero } from './hero';

// Until the visitor interacts with it, every `ContactLink` reports this generic name instead of
// its target — see `src/components/with-logic/contact-link.test.tsx`.
const CONTACT_LINK_NAME = 'Kontaktlink - tippen zum Anzeigen';

function buildSocialMedia(fields: Record<string, string>): SocialMediaQueryResult {
	// The generated result type carries the document meta fields as well.
	return fields as unknown as SocialMediaQueryResult;
}

function renderHero(socialMedia: SocialMediaQueryResult = null) {
	return renderWithUser(
		<Hero
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
		expect(images[0]?.getAttribute('src')).toMatch(/images\/home\/hero\.webp$/u);
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

		expect(within(navigation).getAllByRole('button', { name: CONTACT_LINK_NAME })).toHaveLength(2);
	});
});
