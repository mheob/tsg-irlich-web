import { describe, expect, it } from 'vite-plus/test';

import department, { prepareDepartmentPreview } from './department';

interface ChainRule {
	assetRequired: () => ChainRule;
	error: (message: string) => ChainRule;
	required: () => ChainRule;
}

interface ValidatedField {
	readonly name: string;
	readonly validation?: (rule: ChainRule) => unknown;
}

/**
 * Runs the validation of a field against a rule that only writes down the calls it receives, which
 * is all a builder chain like `Rule.required().assetRequired()` leaves to look at.
 *
 * @param name - The name of the field of the department.
 * @returns The calls of the chain, in order, with the message of `error`.
 */
function recordValidationChain(name: string): string[] {
	const field = (department.fields as readonly ValidatedField[]).find(
		(candidate) => candidate.name === name,
	);
	if (!field?.validation) {
		throw new Error(`Expected the department to validate its "${name}" field.`);
	}

	const calls: string[] = [];
	const rule: ChainRule = {
		assetRequired: () => {
			calls.push('assetRequired');
			return rule;
		},
		error: (message) => {
			calls.push(`error: ${message}`);
			return rule;
		},
		required: () => {
			calls.push('required');
			return rule;
		},
	};
	field.validation(rule);
	return calls;
}

describe('department document', () => {
	it('names its type department', () => {
		expect(department.name).toBe('department');
	});

	it('declares every field the spec lists', () => {
		const fieldNames = department.fields.map((field) => field.name);

		expect(fieldNames).toStrictEqual(
			expect.arrayContaining([
				'title',
				'slug',
				'previousSlugs',
				'icon',
				'sortOrder',
				'isTeamSport',
				'cardImage',
				'heroImage',
				'intro',
				'meta',
				'stats',
				'contactPersons',
			]),
		);
	});

	it('starts with team sport switched off', () => {
		const isTeamSport = department.fields.find((field) => field.name === 'isTeamSport');

		expect(isTeamSport).toMatchObject({ initialValue: false, type: 'boolean' });
	});

	// `required()` alone passes an image object that holds only the alt text, so the department would
	// go live without a card image.
	it('requires an uploaded file for the card image, not only the image object', () => {
		expect(recordValidationChain('cardImage')).toStrictEqual([
			'required',
			'assetRequired',
			'error: Kachelbild ist erforderlich',
		]);
	});

	it('shows the sort order as preview subtitle', () => {
		expect(prepareDepartmentPreview({ sortOrder: 10, title: 'Fußball' })).toStrictEqual({
			media: undefined,
			subtitle: 'Sortierreihenfolge: 10',
			title: 'Fußball',
		});
	});

	it('shows a dash when the sort order is missing', () => {
		expect(prepareDepartmentPreview({ title: 'Neu' }).subtitle).toBe('Sortierreihenfolge: –');
	});
});
