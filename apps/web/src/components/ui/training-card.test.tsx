import { describe, expect, it } from 'vitest';

import type { TrainingTimeSection } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { TrainingCard } from './training-card';

const LOCATION = {
	city: 'Neuwied',
	houseNumber: '20',
	street: 'Gotenstraße',
	zipCode: '56567',
};

function buildTraining(overrides: Record<string, unknown> = {}): TrainingTimeSection {
	// The generated type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		endTime: '20:00',
		season: 'yearly',
		startTime: '18:00',
		venue: { location: LOCATION, title: 'Pappelstadion' },
		weekday: 'monday',
		...overrides,
	} as unknown as TrainingTimeSection;
}

describe('the training card', () => {
	it('names the weekday of the training', () => {
		const { getByRole } = renderWithUser(<TrainingCard training={buildTraining()} />);

		expect(getByRole('heading', { name: /Montag/u })).not.toBeNull();
	});

	it('shows the training time', () => {
		const { getByText } = renderWithUser(<TrainingCard training={buildTraining()} />);

		expect(getByText('18:00 - 20:00 Uhr')).not.toBeNull();
	});

	it('shows the venue and its address', () => {
		const { getByText } = renderWithUser(<TrainingCard training={buildTraining()} />);

		expect(getByText('Pappelstadion')).not.toBeNull();
		expect(getByText('Gotenstraße 20')).not.toBeNull();
		expect(getByText('56567 Neuwied')).not.toBeNull();
	});

	it.each([
		['yearly', 'Ganzjährig'],
		['summer', 'Sommer'],
		['winter', 'Winter'],
	])('labels a %s training as %s', (season, label) => {
		const { getByText } = renderWithUser(<TrainingCard training={buildTraining({ season })} />);

		expect(getByText(label)).not.toBeNull();
	});

	it('shows the note of a training that carries one', () => {
		const { getByText } = renderWithUser(
			<TrainingCard training={buildTraining({ note: 'In den Ferien entfällt das Training.' })} />,
		);

		expect(getByText('In den Ferien entfällt das Training.')).not.toBeNull();
	});

	it('opens the route to the venue after confirming the hand-off to Google Maps', async () => {
		const { findByRole, getByText, user } = renderWithUser(
			<TrainingCard training={buildTraining()} />,
		);

		await user.click(getByText('Route auf Google Maps berechnen'));

		const link = await findByRole('link', { name: 'Google Maps öffnen' });

		expect(link.getAttribute('href')).toContain('google.com/maps');
		expect(link.getAttribute('href')).toContain(encodeURIComponent('Gotenstraße 20'));
	});

	it('renders nothing for a training whose venue has no address', () => {
		const { container } = renderWithUser(
			<TrainingCard training={buildTraining({ venue: { title: 'Pappelstadion' } })} />,
		);

		expect(container.textContent).toBe('');
	});
});
