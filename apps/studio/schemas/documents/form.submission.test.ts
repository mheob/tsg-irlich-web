import { describe, expect, it } from 'vite-plus/test';

import formSubmission, { prepareSubmissionPreview } from './form.submission';

interface SubmissionField {
	readonly name: string;
	readonly options?: { readonly list?: readonly { title: string; value: string }[] };
}

function getField(name: string): SubmissionField {
	const field = (formSubmission as unknown as { fields: readonly SubmissionField[] }).fields.find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected the submission to declare a "${name}" field.`);
	}
	return field;
}

describe('form submission document', () => {
	it('has the expected fields in order', () => {
		expect(formSubmission.fields.map((field) => field.name)).toStrictEqual([
			'form',
			'submittedAt',
			'status',
			'label',
			'answers',
			'cleanedAt',
		]);
	});

	it('is live-edited', () => {
		expect((formSubmission as unknown as { liveEdit?: boolean }).liveEdit).toBe(true);
	});

	it('offers the three statuses', () => {
		expect(getField('status').options?.list).toStrictEqual([
			{ title: 'angemeldet', value: 'registered' },
			{ title: 'Warteliste', value: 'waitlist' },
			{ title: 'abgemeldet', value: 'cancelled' },
		]);
	});
});

describe('form submission preview', () => {
	it('previews label and status', () => {
		expect(
			prepareSubmissionPreview({
				label: 'Chicken Friends',
				status: 'waitlist',
				submittedAt: '2027-04-02T08:15:00Z',
			}),
		).toStrictEqual({ subtitle: 'Warteliste · 02.04.2027 10:15', title: 'Chicken Friends' });
	});

	it('falls back to "Ohne Bezeichnung"', () => {
		expect(
			prepareSubmissionPreview({ status: 'registered', submittedAt: '2027-04-02T08:15:00Z' }).title,
		).toBe('Ohne Bezeichnung');
	});

	it('leaves out what is missing from the subtitle', () => {
		expect(prepareSubmissionPreview({ label: 'A' }).subtitle).toBe('');
		expect(prepareSubmissionPreview({ label: 'A', status: 'cancelled' }).subtitle).toBe(
			'abgemeldet',
		);
	});
});
