import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { FallbackImage, Venue } from './types';
import { VenueImage } from './venue-image';

const VENUE_IMAGE = {
	_type: 'image' as const,
	alt: 'Das Pappelstadion von oben',
	asset: { _ref: 'image-stadium-4000x2250-jpg', _type: 'reference' as const },
};

const FALLBACK: FallbackImage = {
	_type: 'extendedImage',
	alt: 'Das Logo der TSG Irlich',
	asset: { _ref: 'image-fallback-1200x900-jpg', _type: 'reference' as const },
};

const VENUE_WITHOUT_IMAGE: Pick<Venue, 'mainImage' | 'title'> = {
	mainImage: null,
	title: 'Turnhalle Niederbieber',
};

describe('venue image', () => {
	it('shows the image of the venue with its alt text', () => {
		renderWithUser(
			<VenueImage sizes="100vw" venue={{ mainImage: VENUE_IMAGE, title: 'Pappelstadion' }} />,
		);

		expect(document.querySelector('img')?.getAttribute('alt')).toBe('Das Pappelstadion von oben');
	});

	it('falls back to the site image when the venue has no image file', () => {
		renderWithUser(
			<VenueImage fallbackImage={FALLBACK} sizes="100vw" venue={VENUE_WITHOUT_IMAGE} />,
		);

		expect(document.querySelector('img')?.getAttribute('src')).toContain('fallback-1200x900');
	});

	it('names the venue when the fallback image carries no alt text', () => {
		renderWithUser(
			<VenueImage
				fallbackImage={{ ...FALLBACK, alt: '' }}
				sizes="100vw"
				venue={VENUE_WITHOUT_IMAGE}
			/>,
		);

		expect(document.querySelector('img')?.getAttribute('alt')).toBe('Turnhalle Niederbieber');
	});

	it('renders no image when neither the venue nor the site has one', () => {
		renderWithUser(<VenueImage sizes="100vw" venue={VENUE_WITHOUT_IMAGE} />);

		expect(document.querySelector('img')).toBeNull();
	});
});
