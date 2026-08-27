import { describe, expect, it } from 'vitest';

import trainingTimeField from './training-time';

interface TrainingTimeSelection {
	readonly endTime?: string;
	readonly note?: string;
	readonly season?: string;
	readonly startTime?: string;
	readonly venue?: string;
	readonly weekday?: string;
}

function prepareTrainingTime(selection: TrainingTimeSelection): { title: string } {
	return (
		trainingTimeField.preview.prepare as unknown as (value: TrainingTimeSelection) => {
			title: string;
		}
	)(selection);
}

const fullSelection: TrainingTimeSelection = {
	endTime: '20:00',
	note: 'Bitte pünktlich',
	season: 'winter',
	startTime: '18:00',
	venue: 'Sporthalle',
	weekday: 'monday',
};

describe('training time preview', () => {
	it('assembles the title from every field when all are present', () => {
		const result = prepareTrainingTime(fullSelection);

		expect(result).toStrictEqual({
			title: 'winter | monday, 18:00 - 20:00 | Sporthalle | Bitte pünktlich',
		});
	});

	it('falls back to an underscore for a missing season', () => {
		const result = prepareTrainingTime({ ...fullSelection, season: undefined });

		expect(result.title).toBe('_ | monday, 18:00 - 20:00 | Sporthalle | Bitte pünktlich');
	});

	it('falls back to an underscore for a missing weekday', () => {
		const result = prepareTrainingTime({ ...fullSelection, weekday: undefined });

		expect(result.title).toBe('winter | _, 18:00 - 20:00 | Sporthalle | Bitte pünktlich');
	});

	it('falls back to an underscore for a missing start time', () => {
		const result = prepareTrainingTime({ ...fullSelection, startTime: undefined });

		expect(result.title).toBe('winter | monday, _ - 20:00 | Sporthalle | Bitte pünktlich');
	});

	it('falls back to an underscore for a missing end time', () => {
		const result = prepareTrainingTime({ ...fullSelection, endTime: undefined });

		expect(result.title).toBe('winter | monday, 18:00 - _ | Sporthalle | Bitte pünktlich');
	});

	it('falls back to an underscore for a missing venue', () => {
		const result = prepareTrainingTime({ ...fullSelection, venue: undefined });

		expect(result.title).toBe('winter | monday, 18:00 - 20:00 | _ | Bitte pünktlich');
	});

	it('falls back to an underscore for a missing note', () => {
		const result = prepareTrainingTime({ ...fullSelection, note: undefined });

		expect(result.title).toBe('winter | monday, 18:00 - 20:00 | Sporthalle | _');
	});

	it('falls back to an underscore for every field when none are present', () => {
		const result = prepareTrainingTime({});

		expect(result.title).toBe('_ | _, _ - _ | _ | _');
	});
});
