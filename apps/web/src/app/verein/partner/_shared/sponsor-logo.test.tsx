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
	it('shows the logo as a decorative image', () => {
		const { container, queryByText } = renderWithUser(<SponsorLogo sponsor={WITH_LOGO} />);

		expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
		expect(queryByText('REWE Müller')).toBeNull();
	});

	it('shows the name where the logo has no file', () => {
		const { container, getByText } = renderWithUser(
			<SponsorLogo sponsor={{ ...WITH_LOGO, logo: { _type: 'image' } }} />,
		);

		expect(getByText('REWE Müller')).not.toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});

	it('passes a class name on to the logo box', () => {
		const { container } = renderWithUser(<SponsorLogo className="mt-2" sponsor={WITH_LOGO} />);

		expect(container.firstElementChild?.className).toContain('mt-2');
	});
});
