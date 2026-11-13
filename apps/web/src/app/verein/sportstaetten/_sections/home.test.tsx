import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { Inquiry, Venue } from '../_shared/types';
import { Home } from './home';

const INQUIRY: Inquiry = {
	email: 'info@tsg-irlich.de',
	subject: 'Frage zu den Sportstätten der TSG Irlich',
};

const TURF_MAIL =
	'mailto:info@tsg-irlich.de?subject=Frage%20zu%20den%20Sportst%C3%A4tten%20der%20TSG%20Irlich';

function venue(overrides: Partial<Venue> = {}): Venue {
	return {
		_id: 'stadium',
		description: null,
		features: null,
		groups: [],
		location: null,
		mainImage: null,
		openingHours: null,
		title: 'Pappelstadion',
		type: 'cinder',
		...overrides,
	};
}

const CLUBHOUSE = venue({
	_id: 'clubhouse',
	openingHours: [
		{ _key: 'row-1', _type: 'venueOpeningHours', days: 'Dienstag bis Freitag', time: 'ab 17 Uhr' },
	],
	title: 'Vereinsheim Pappelstübchen',
	type: 'clubhouse',
});

type HomeSectionProp = ComponentProps<typeof Home>['section'];

function section(overrides: Partial<HomeSectionProp> = {}): HomeSectionProp {
	return {
		intro: 'Im Pappelstadion schlägt das Herz der TSG.',
		subtitle: 'Unsere Heimat',
		title: 'Pappelstadion & Pappelstübchen',
		turfBox: {
			linkText: 'Sprich uns an, wenn du helfen willst',
			text: 'Ein Kunstrasen würde den Spielbetrieb wetterunabhängig machen.',
			title: 'Unser Traum: Kunstrasen',
		},
		venues: [venue(), CLUBHOUSE],
		...overrides,
	};
}

describe('home section', () => {
	it('shows the header and both home venues in order', () => {
		renderWithUser(<Home inquiry={INQUIRY} section={section()} />);

		expect(
			screen.getByRole('heading', { level: 2, name: 'Pappelstadion & Pappelstübchen' }),
		).not.toBeNull();
		expect(
			screen.getAllByRole('heading', { level: 3 }).map((item) => item.textContent),
		).toStrictEqual(['Pappelstadion', 'Vereinsheim Pappelstübchen']);
	});

	it('puts the turf box with its mail link below the first venue', () => {
		renderWithUser(<Home inquiry={INQUIRY} section={section()} />);

		expect(screen.getByText('Unser Traum: Kunstrasen')).not.toBeNull();
		expect(
			screen
				.getByRole('link', { name: 'Sprich uns an, wenn du helfen willst' })
				.getAttribute('href'),
		).toBe(TURF_MAIL);
	});

	it('leaves the turf box out without a title and a text', () => {
		renderWithUser(
			<Home inquiry={INQUIRY} section={section({ turfBox: { linkText: 'Sprich uns an' } })} />,
		);

		expect(screen.queryByRole('link', { name: 'Sprich uns an' })).toBeNull();
	});

	it('shows the opening hours of the clubhouse', () => {
		renderWithUser(<Home inquiry={INQUIRY} section={section()} />);

		expect(screen.getByText('Öffnungszeiten')).not.toBeNull();
		expect(screen.getByText('Dienstag bis Freitag')).not.toBeNull();
		expect(screen.getByText('ab 17 Uhr')).not.toBeNull();
	});

	it('leaves the opening hours out when a venue has none', () => {
		renderWithUser(
			<Home inquiry={INQUIRY} section={section({ venues: [venue(), venue({ _id: 'other' })] })} />,
		);

		expect(screen.queryByText('Öffnungszeiten')).toBeNull();
	});

	it('offers nothing to rent', () => {
		const { container } = renderWithUser(<Home inquiry={INQUIRY} section={section()} />);

		expect(container.textContent).not.toMatch(/miet/iu);
	});

	it('drops a home venue that no longer resolves', () => {
		renderWithUser(<Home inquiry={INQUIRY} section={section({ venues: [venue(), null] })} />);

		expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
	});

	it('leaves the section out when no home venue resolves', () => {
		const { container } = renderWithUser(
			<Home inquiry={INQUIRY} section={section({ venues: [null, null] })} />,
		);

		expect(container.firstChild).toBeNull();
	});
});
