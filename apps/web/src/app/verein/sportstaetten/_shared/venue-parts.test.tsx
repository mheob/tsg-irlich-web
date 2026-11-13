import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { Venue, VenueGroup } from './types';
import {
	FeatureList,
	VenueAddress,
	VenueGroups,
	VenueRouteButton,
	VenueWeekdays,
} from './venue-parts';

const LOCATION = {
	city: 'Neuwied',
	houseNumber: '20',
	name: 'Pappelstadion Neuwied/Irlich',
	street: 'Gotenstraße',
	zipCode: '56567',
};

// A group whose department has no slug comes back without one, which TypeGen does not express.
function group(
	overrides: Omit<Partial<VenueGroup>, 'department'> & { department?: null | string } = {},
): VenueGroup {
	return {
		_id: 'group-1',
		department: 'fussball',
		slug: '1-mannschaft',
		title: '1. Mannschaft',
		weekdays: ['monday'],
		...overrides,
	} as VenueGroup;
}

function venue(overrides: Partial<Venue> = {}): Venue {
	return {
		_id: 'venue-1',
		description: null,
		features: null,
		groups: [],
		location: LOCATION,
		mainImage: null,
		openingHours: null,
		title: 'Pappelstadion',
		type: 'cinder',
		...overrides,
	};
}

describe('venue address', () => {
	it('shows the street and the city in two lines', () => {
		renderWithUser(<VenueAddress venue={venue()} />);

		expect(screen.getByText(/Gotenstraße 20/u)).not.toBeNull();
		expect(screen.getByText(/56567 Neuwied/u)).not.toBeNull();
	});

	it('shows nothing without a location', () => {
		const { container } = renderWithUser(<VenueAddress venue={venue({ location: null })} />);

		expect(container.firstChild).toBeNull();
	});
});

describe('venue route button', () => {
	it('offers the route of a venue with a location', () => {
		renderWithUser(<VenueRouteButton venue={venue()} />);

		expect(screen.getByRole('button', { name: 'Route planen' })).not.toBeNull();
	});

	it('offers no route without a location', () => {
		const { container } = renderWithUser(<VenueRouteButton venue={venue({ location: null })} />);

		expect(container.firstChild).toBeNull();
	});
});

describe('venue groups', () => {
	it('links every group to its page', () => {
		renderWithUser(
			<VenueGroups
				venue={venue({
					groups: [group(), group({ _id: 'group-2', slug: 'a-jugend', title: 'A-Jugend' })],
				})}
			/>,
		);

		expect(screen.getByRole('link', { name: '1. Mannschaft' }).getAttribute('href')).toBe(
			'/angebot/fussball/1-mannschaft',
		);
		expect(screen.getByRole('link', { name: 'A-Jugend' })).not.toBeNull();
	});

	it('drops a group that has no page', () => {
		const { container } = renderWithUser(
			<VenueGroups venue={venue({ groups: [group({ department: null })] })} />,
		);

		expect(container.firstChild).toBeNull();
	});

	it('counts the groups beyond the limit', () => {
		const groups = Array.from({ length: 6 }, (_item, index) =>
			group({ _id: `group-${index}`, slug: `gruppe-${index}`, title: `Gruppe ${index}` }),
		);

		renderWithUser(<VenueGroups limit={4} venue={venue({ groups })} />);

		expect(screen.getAllByRole('link')).toHaveLength(4);
		expect(screen.getByText('+ 2 weitere')).not.toBeNull();
	});
});

describe('venue weekdays', () => {
	it('names the training days for screen readers', () => {
		renderWithUser(
			<VenueWeekdays
				venue={venue({
					groups: [group({ weekdays: ['wednesday'] }), group({ _id: 'group-2' })],
				})}
			/>,
		);

		expect(screen.getByText('Trainingstage: Montag, Mittwoch')).not.toBeNull();
	});

	it('shows nothing without a training day', () => {
		const { container } = renderWithUser(<VenueWeekdays venue={venue()} />);

		expect(container.firstChild).toBeNull();
	});
});

describe('feature list', () => {
	it('lists every feature', () => {
		renderWithUser(<FeatureList features={['Flutlicht', 'Umkleiden und Duschen']} />);

		expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toStrictEqual([
			'Flutlicht',
			'Umkleiden und Duschen',
		]);
	});

	it('shows nothing without a feature', () => {
		const { container } = renderWithUser(<FeatureList features={null} />);

		expect(container.firstChild).toBeNull();
	});
});
