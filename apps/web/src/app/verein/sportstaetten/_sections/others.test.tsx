import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { OthersSection, Venue } from '../_shared/types';
import { Others } from './others';

const SECTION: OthersSection = {
	intro: 'Nicht alle Gruppen passen ins Pappelstadion.',
	subtitle: 'Alle weiteren Sportanlagen',
	title: 'Hier sind wir außerdem aktiv',
};

function venue(overrides: Partial<Venue> = {}): Venue {
	return {
		_id: 'venue-1',
		description: null,
		features: null,
		groups: [],
		location: null,
		mainImage: null,
		openingHours: null,
		title: 'Mehrzweckhalle Irlich',
		type: 'hall-1',
		...overrides,
	};
}

const HALLS = [venue(), venue({ _id: 'venue-2', title: 'Turnhalle Niederbieber', type: 'hall-3' })];
const FIELDS = [venue({ _id: 'venue-3', title: 'Sportplatz Hüllenberg', type: 'grass' })];

describe('other venues', () => {
	it('lists the halls and the fields under their headings', () => {
		renderWithUser(<Others fields={FIELDS} halls={HALLS} section={SECTION} />);

		expect(
			screen.getByRole('heading', { level: 2, name: 'Hier sind wir außerdem aktiv' }),
		).not.toBeNull();
		expect(screen.getByRole('heading', { level: 3, name: 'Hallen' })).not.toBeNull();
		expect(screen.getByRole('heading', { level: 3, name: 'Plätze' })).not.toBeNull();
		expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3);
	});

	it('leaves a heading out when it has no venue', () => {
		renderWithUser(<Others fields={[]} halls={HALLS} section={SECTION} />);

		expect(screen.queryByRole('heading', { level: 3, name: 'Plätze' })).toBeNull();
		expect(screen.getByRole('heading', { level: 3, name: 'Hallen' })).not.toBeNull();
	});

	it('leaves the section out without other venues', () => {
		const { container } = renderWithUser(<Others fields={[]} halls={[]} section={SECTION} />);

		expect(container.firstChild).toBeNull();
	});
});
