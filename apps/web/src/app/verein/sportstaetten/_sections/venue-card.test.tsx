import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { Venue } from '../_shared/types';
import { VenueCard } from './venue-card';

function venue(overrides: Partial<Venue> = {}): Venue {
	return {
		_id: 'venue-1',
		description: null,
		features: null,
		groups: [
			{
				_id: 'group-1',
				department: 'kurse',
				slug: 'yoga',
				title: 'Yoga',
				weekdays: ['wednesday'],
			},
		],
		location: {
			city: 'Neuwied',
			houseNumber: '5',
			name: 'Mehrzweckhalle Irlich',
			street: 'Apostelstraße',
			zipCode: '56567',
		},
		mainImage: null,
		openingHours: null,
		title: 'Mehrzweckhalle Irlich',
		type: 'hall-1',
		...overrides,
	};
}

describe('venue card', () => {
	it('shows the kind and the name of the venue', () => {
		renderWithUser(<VenueCard venue={venue()} />);

		expect(screen.getByText('Einfeldhalle')).not.toBeNull();
		expect(screen.getByRole('heading', { level: 4, name: 'Mehrzweckhalle Irlich' })).not.toBeNull();
	});

	it('shows the address, the training days, the groups and the route', () => {
		renderWithUser(<VenueCard venue={venue()} />);

		expect(screen.getByText(/Apostelstraße 5/u)).not.toBeNull();
		expect(screen.getByText('Trainingstage: Mittwoch')).not.toBeNull();
		expect(screen.getByRole('link', { name: 'Yoga' })).not.toBeNull();
		expect(screen.getByRole('button', { name: 'Route planen' })).not.toBeNull();
	});

	it('shows at most four groups and counts the rest', () => {
		const groups = Array.from({ length: 6 }, (_item, index) => ({
			_id: `group-${index}`,
			department: 'kurse',
			slug: `gruppe-${index}`,
			title: `Gruppe ${index}`,
			weekdays: ['monday' as const],
		}));

		renderWithUser(<VenueCard venue={venue({ groups })} />);

		expect(screen.getAllByRole('link')).toHaveLength(4);
		expect(screen.getByText('+ 2 weitere')).not.toBeNull();
	});

	it('keeps the name readable without any image', () => {
		renderWithUser(<VenueCard venue={venue()} />);

		expect(document.querySelector('img')).toBeNull();
		expect(screen.getByRole('heading', { level: 4, name: 'Mehrzweckhalle Irlich' })).not.toBeNull();
	});

	it('leaves address and route out without a location', () => {
		renderWithUser(<VenueCard venue={venue({ location: null })} />);

		expect(screen.queryByRole('button', { name: 'Route planen' })).toBeNull();
		expect(screen.queryByText(/Apostelstraße/u)).toBeNull();
	});
});
