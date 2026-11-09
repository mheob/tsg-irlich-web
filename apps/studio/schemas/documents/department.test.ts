import { describe, expect, it } from 'vite-plus/test';

import department, {
	prepareDepartmentPreview,
	validateDepartmentIntro,
	validateDepartmentMetaDescription,
} from './department';

interface ChainRule {
	assetRequired: () => ChainRule;
	error: (message: string) => ChainRule;
	required: () => ChainRule;
	unique: () => ChainRule;
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
		unique: () => {
			calls.push('unique');
			return rule;
		},
	};
	field.validation(rule);
	return calls;
}

/**
 * Runs the validation of a field against a rule that hands back the predicate of `custom` once the
 * chain ends in `warning()`, so the test sees which function a `Rule.custom(fn).warning()` checks with.
 *
 * @param name - The name of the field of the department.
 * @returns The predicate the field checks with, or whatever else the validation returned.
 */
function getWarningPredicate(name: string): unknown {
	const field = department.fields.find((candidate) => candidate.name === name) as
		| { readonly validation?: (rule: unknown) => unknown }
		| undefined;
	if (!field?.validation) {
		throw new Error(`Expected the department to validate its "${name}" field.`);
	}

	return field.validation({ custom: (fn: unknown) => ({ warning: () => fn }) });
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

	it('offers search terms right after the title', () => {
		const fieldNames = department.fields.map((field) => field.name);
		const searchTerms = department.fields.find((field) => field.name === 'searchTerms');

		expect(fieldNames[fieldNames.indexOf('title') + 1]).toBe('searchTerms');
		expect(searchTerms).toMatchObject({
			of: [{ type: 'string' }],
			options: { layout: 'tags' },
			title: 'Suchbegriffe',
			type: 'array',
		});
	});

	// The page shows Stats › FAQ › Ansprechpartner, so the form keeps the same order.
	it('lists its FAQ between the stats and the contact persons', () => {
		const fieldNames = department.fields.map((field) => field.name);

		expect(fieldNames.indexOf('faqs')).toBe(fieldNames.indexOf('stats') + 1);
		expect(fieldNames.indexOf('contactPersons')).toBe(fieldNames.indexOf('faqs') + 1);
	});

	// A strong reference keeps a question that a department still shows from being deleted.
	it('keeps its FAQ as a sortable list of strong references in the content tab', () => {
		const faqs = department.fields.find((field) => field.name === 'faqs');

		expect(faqs).toMatchObject({
			group: 'content',
			of: [{ to: [{ type: 'faq' }], type: 'reference' }],
			title: 'FAQ',
			type: 'array',
		});
		expect(faqs).not.toHaveProperty('of.0.weak');
	});

	it('refuses the same FAQ twice', () => {
		expect(recordValidationChain('faqs')).toStrictEqual([
			'unique',
			'error: Eine Frage darf nur einmal ausgewählt werden',
		]);
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

	// Without its own texts a department page shows the intro and the description all departments
	// share (WEB-417). A warning, not an error: a new department may go live before its texts exist.
	describe('own texts', () => {
		it('only warns when the intro is missing', () => {
			expect(getWarningPredicate('intro')).toBe(validateDepartmentIntro);
		});

		it.each([
			['no intro', undefined],
			['an empty intro', ''],
			['an intro of blanks', ' \n '],
		])('names the shared text for %s', (_description, intro) => {
			expect(validateDepartmentIntro(intro)).toBe(
				'Ohne eigenes Intro zeigt die Abteilungsseite den gemeinsamen Text aller Abteilungen.',
			);
		});

		it('accepts an intro of its own', () => {
			expect(validateDepartmentIntro('Fußball in Irlich für alle Altersklassen.')).toBe(true);
		});

		it('only warns when the meta description is missing', () => {
			expect(getWarningPredicate('meta')).toBe(validateDepartmentMetaDescription);
		});

		it.each([
			['no meta object', undefined],
			['a meta object without description', { metaTitle: 'Fußball in Irlich' }],
			['a description of blanks', { metaDescription: '  ' }],
		])('names the fallback for %s', (_description, meta) => {
			expect(validateDepartmentMetaDescription(meta)).toBe(
				'Ohne eigene Meta-Beschreibung steht in Suchergebnissen das Intro oder, ohne Intro, der gemeinsame Text aller Abteilungen.',
			);
		});

		it('accepts a meta description of its own', () => {
			expect(
				validateDepartmentMetaDescription({ metaDescription: 'Fußball bei der TSG Irlich.' }),
			).toBe(true);
		});
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
