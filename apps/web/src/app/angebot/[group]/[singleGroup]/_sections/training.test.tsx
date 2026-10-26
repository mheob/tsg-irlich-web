import { describe, expect, it } from 'vite-plus/test';

import type { TrainingTimeSection } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../../test-utils/render';
import { Training } from './training';

function buildTrainingTime(key: string, weekday: string): TrainingTimeSection {
	// The generated type carries more fields than a fixture needs to name.
	return {
		_key: key,
		endTime: '20:00',
		season: 'yearly',
		startTime: '18:00',
		venue: {
			location: { city: 'Neuwied', houseNumber: '20', street: 'Gotenstraße', zipCode: '56567' },
			title: 'Pappelstadion',
		},
		weekday,
	} as unknown as TrainingTimeSection;
}

describe('the training section of a group', () => {
	it('names the section in its heading', () => {
		const { getByRole } = renderWithUser(<Training title="Trainingszeiten" />);

		expect(getByRole('heading', { level: 2, name: 'Trainingszeiten' })).not.toBeNull();
	});

	it('shows a card for every training time', () => {
		const { getAllByRole, getByRole } = renderWithUser(
			<Training
				title="Trainingszeiten"
				training={{
					trainingTimes: [
						buildTrainingTime('monday', 'monday'),
						buildTrainingTime('wednesday', 'wednesday'),
					],
				}}
			/>,
		);

		expect(getByRole('heading', { name: /Montag/u })).not.toBeNull();
		expect(getByRole('heading', { name: /Mittwoch/u })).not.toBeNull();
		expect(getAllByRole('heading', { level: 3 })).toHaveLength(2);
	});

	it.each([
		['no training at all', null],
		['no training times', { trainingTimes: null }],
		['an empty list of training times', { trainingTimes: [] }],
	])('shows no training card for a group with %s', (_case, training) => {
		const { queryAllByRole } = renderWithUser(
			<Training title="Trainingszeiten" training={training} />,
		);

		expect(queryAllByRole('heading', { level: 3 })).toHaveLength(0);
	});
});
