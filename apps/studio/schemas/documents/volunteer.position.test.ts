import { describe, expect, it } from 'vite-plus/test';

import volunteerPosition, { prepareVolunteerPositionPreview } from './volunteer.position';

interface PositionField {
	readonly name: string;
	readonly of?: readonly { type: string }[];
	readonly type: string;
	readonly validation?: (rule: unknown) => unknown;
}

const fields = (volunteerPosition as unknown as { fields: readonly PositionField[] }).fields;

function getField(name: string): PositionField {
	const field = fields.find((candidate) => candidate.name === name);

	if (!field) {
		throw new Error(`Expected the position to declare a "${name}" field.`);
	}

	return field;
}

/**
 * Runs the validation of a field against a rule that records the name of every method called on
 * it, so a test can tell whether the field is required.
 *
 * @param field - The field.
 * @returns The names of the called rule methods.
 */
function recordedRuleCalls(field: PositionField): string[] {
	const calls: string[] = [];
	const rule: object = new Proxy(
		{},
		{
			get:
				(_target, property) =>
				(..._args: unknown[]) => {
					calls.push(String(property));
					return rule;
				},
		},
	);
	field.validation?.(rule);

	return calls;
}

describe('volunteer position document', () => {
	it('names its type volunteer.position and titles it „Offene Aufgabe“', () => {
		expect(volunteerPosition).toMatchObject({
			name: 'volunteer.position',
			title: 'Offene Aufgabe',
		});
	});

	it('declares title, area, effort, teaser and the three lists in that order', () => {
		expect(fields.map(({ name, type }) => [name, type])).toStrictEqual([
			['title', 'string'],
			['area', 'string'],
			['effort', 'string'],
			['teaser', 'text'],
			['tasks', 'array'],
			['profile', 'array'],
			['offer', 'array'],
		]);
	});

	it('holds short texts in the three lists', () => {
		for (const name of ['tasks', 'profile', 'offer']) {
			expect(getField(name).of).toStrictEqual([{ type: 'string' }]);
		}
	});

	it.each(['title', 'area', 'teaser'])('requires the %s', (name) => {
		expect(recordedRuleCalls(getField(name))).toContain('required');
	});

	it.each(['effort', 'tasks', 'profile', 'offer'])('lets the %s stay empty', (name) => {
		expect(recordedRuleCalls(getField(name))).not.toContain('required');
	});

	it('lists the newest position first, or by title', () => {
		expect(volunteerPosition.orderings.map(({ by }) => by)).toStrictEqual([
			[{ direction: 'desc', field: '_createdAt' }],
			[{ direction: 'asc', field: 'title' }],
		]);
	});
});

describe('volunteer position preview', () => {
	it('shows the title above the area', () => {
		expect(
			prepareVolunteerPositionPreview({ area: 'Fußball', title: 'Schiedsrichter/in' }),
		).toStrictEqual({
			subtitle: 'Fußball',
			title: 'Schiedsrichter/in',
		});
	});
});
