import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import { SponsorLogo } from './sponsor-logo';
import type { Sponsor } from './types';

const WITH_LOGO: Sponsor = {
	_id: 'a',
	logo: { _type: 'image', asset: { _ref: 'image-abc123-640x320-png', _type: 'reference' } },
	name: 'REWE Müller',
	website: null,
};

describe('the logo of a sponsor', () => {
	it('shows the logo as a decorative contained image', () => {
		const { container } = renderWithUser(<SponsorLogo sponsor={WITH_LOGO} />);
		const image = container.querySelector('img');

		expect(image?.getAttribute('alt')).toBe('');
		expect(image?.className).toContain('object-contain');
	});

	it('shows the name in the serif font where the logo has no file', () => {
		const { getByText } = renderWithUser(
			<SponsorLogo className="mt-2" sponsor={{ ...WITH_LOGO, logo: { _type: 'image' } }} />,
		);

		expect(getByText('REWE Müller').className).toContain('font-serif');
		expect(getByText('REWE Müller').className).toContain('mt-2');
	});

	it('passes a class name on to the logo box', () => {
		const { container } = renderWithUser(<SponsorLogo className="mt-2" sponsor={WITH_LOGO} />);

		expect(container.firstElementChild?.className).toContain('mt-2');
	});
});
