import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { Sponsor } from '../_shared/types';
import { SponsorTile } from './sponsor-tile';

const SPONSOR: Sponsor = {
	_id: 'a',
	logo: { _type: 'image' },
	name: 'REWE Müller',
	website: 'https://www.rewe-mueller.de/markt',
};

describe('a sponsor tile', () => {
	it('links a sponsor with a website as sponsored, in a new window', () => {
		const { getByRole, getByText } = renderWithUser(<SponsorTile sponsor={SPONSOR} />);
		const link = getByRole('link');

		expect(link.getAttribute('rel')).toContain('sponsored');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('href')).toBe(SPONSOR.website);
		expect(getByText('rewe-mueller.de')).not.toBeNull();
		expect(link.textContent).toContain('(öffnet in neuem Fenster)');
	});

	it('shows a sponsor without a website without a link, host or icon', () => {
		const { container, queryByRole, queryByText } = renderWithUser(
			<SponsorTile sponsor={{ ...SPONSOR, website: null }} />,
		);

		expect(queryByRole('link')).toBeNull();
		expect(queryByText('rewe-mueller.de')).toBeNull();
		expect(queryByText('(öffnet in neuem Fenster)')).toBeNull();
		expect(container.querySelector('svg')).toBeNull();
	});

	it('shows the name where the logo has no file', () => {
		const { getByRole } = renderWithUser(<SponsorTile sponsor={SPONSOR} />);

		// The fallback name in the logo box is hidden from assistive technology, so the name is read once.
		expect(
			getByRole('link', { name: 'REWE Müllerrewe-mueller.de(öffnet in neuem Fenster)' }),
		).not.toBeNull();
	});

	// jsdom cannot observe hover or focus styles, so the grey-at-rest classes are checked directly.
	it('greys the logo until hover or focus', () => {
		const { container } = renderWithUser(<SponsorTile sponsor={SPONSOR} />);
		const classes = container.querySelector('.grayscale')?.className;

		expect(classes).toContain('opacity-70');
		expect(classes).toContain('group-hover:grayscale-0');
		expect(classes).toContain('group-focus-visible:grayscale-0');
	});

	// Same limit as above: the hover class is the only observable trace of the behaviour.
	it('turns the logo of a tile without a website colourful on hover only', () => {
		const { container } = renderWithUser(<SponsorTile sponsor={{ ...SPONSOR, website: null }} />);
		const classes = container.querySelector('.grayscale')?.className;

		expect(classes).toContain('group-hover:grayscale-0');
		expect(classes).not.toContain('group-focus-visible');
	});
});
