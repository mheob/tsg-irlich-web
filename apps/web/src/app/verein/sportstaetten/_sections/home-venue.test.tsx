import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { Venue } from '../_shared/types';
import { HomeVenue } from './home-venue';

const DESCRIPTION = [
	{
		_key: 'block-1',
		_type: 'block' as const,
		children: [{ _key: 'span-1', _type: 'span' as const, text: 'Seit Jahrzehnten unsere Heimat.' }],
		markDefs: [],
		style: 'normal' as const,
	},
	{
		_key: 'block-2',
		_type: 'block' as const,
		children: [{ _key: 'span-2', _type: 'span' as const, text: 'Mit Flutlicht und Vereinsheim.' }],
		markDefs: [],
		style: 'normal' as const,
	},
];

function venue(overrides: Partial<Venue> = {}): Venue {
	return {
		_id: 'venue-1',
		description: DESCRIPTION,
		features: ['Flutlicht für Training und Spiele'],
		groups: [
			{
				_id: 'group-1',
				department: 'fussball',
				slug: '1-mannschaft',
				title: '1. Mannschaft',
				weekdays: ['monday'],
			},
		],
		location: {
			city: 'Neuwied',
			houseNumber: '20',
			name: 'Pappelstadion Neuwied/Irlich',
			street: 'Gotenstraße',
			zipCode: '56567',
		},
		mainImage: null,
		openingHours: null,
		title: 'Pappelstadion',
		type: 'cinder',
		...overrides,
	};
}

describe('home venue', () => {
	it('shows the kind, the name and the whole description', () => {
		renderWithUser(<HomeVenue venue={venue()} />);

		expect(screen.getByText('Aschenplatz')).not.toBeNull();
		expect(screen.getByRole('heading', { level: 3, name: 'Pappelstadion' })).not.toBeNull();
		expect(screen.getByText('Seit Jahrzehnten unsere Heimat.')).not.toBeNull();
		expect(screen.getByText('Mit Flutlicht und Vereinsheim.')).not.toBeNull();
	});

	it('heads the equipment after the kind of venue', () => {
		renderWithUser(<HomeVenue venue={venue({ type: 'hall-2' })} />);

		expect(screen.getByRole('heading', { level: 4, name: 'Das bietet die Halle' })).not.toBeNull();
	});

	it('shows address, route and groups in the strip', () => {
		renderWithUser(<HomeVenue venue={venue()} />);

		expect(screen.getByRole('heading', { level: 4, name: 'So findest du hin' })).not.toBeNull();
		expect(screen.getByRole('button', { name: 'Route planen' })).not.toBeNull();
		expect(screen.getByRole('heading', { level: 4, name: 'Hier trainieren' })).not.toBeNull();
		expect(screen.getByRole('link', { name: '1. Mannschaft' })).not.toBeNull();
	});

	it('leaves out a column of the strip that has nothing to show', () => {
		renderWithUser(<HomeVenue venue={venue({ groups: [] })} />);

		expect(screen.queryByRole('heading', { level: 4, name: 'Hier trainieren' })).toBeNull();
		expect(screen.getByRole('heading', { level: 4, name: 'Das bietet der Platz' })).not.toBeNull();
	});

	it('leaves the strip out when no column has anything to show', () => {
		renderWithUser(<HomeVenue venue={venue({ features: null, groups: [], location: null })} />);

		expect(screen.queryAllByRole('heading', { level: 4 })).toStrictEqual([]);
		expect(screen.getByRole('heading', { level: 3, name: 'Pappelstadion' })).not.toBeNull();
	});

	it('shows the children below the venue', () => {
		renderWithUser(
			<HomeVenue venue={venue()}>
				<p>Unser Traum: Kunstrasen</p>
			</HomeVenue>,
		);

		expect(screen.getByText('Unser Traum: Kunstrasen')).not.toBeNull();
	});

	it('shows the fallback image when the venue has none', () => {
		renderWithUser(
			<HomeVenue
				fallbackImage={{
					_type: 'extendedImage',
					alt: 'Das Logo der TSG Irlich',
					asset: { _ref: 'image-fallback-1200x900-jpg', _type: 'reference' },
				}}
				venue={venue()}
			/>,
		);

		expect(document.querySelector('img')?.getAttribute('src')).toContain('fallback-1200x900');
	});
});
