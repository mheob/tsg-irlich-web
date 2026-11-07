import { describe, expect, it } from 'vite-plus/test';

import { previousArticleSlugsField, previousPathsField, previousSlugsField } from './slug-history';

interface HistoryError {
	readonly message: string;
	readonly path: readonly number[];
}

type HistoryValidator = (value?: readonly string[]) => HistoryError[] | true;

interface HistoryField {
	readonly validation?: (rule: FakeRule) => HistoryValidator;
}

interface FakeRule {
	custom: (fn: HistoryValidator) => HistoryValidator;
}

const SLUG_MESSAGE = 'Bitte nur den Slug eintragen, z. B. kurse';
const ARTICLE_MESSAGE =
	'Bitte nur den Slug ohne /news und Kategorie eintragen, z. B. heimsieg-gegen-engers';
const PATH_MESSAGE = 'Bitte Abteilung und Gruppe ohne /angebot eintragen, z. B. kurse/yoga';

// The validation is a single `Rule.custom` on the array, so a rule that hands the function back is
// all it takes to call it.
function getValidator(definition: unknown): HistoryValidator {
	const field = definition as HistoryField;
	if (!field.validation) {
		throw new Error('Expected the history field to declare a validation function.');
	}
	return field.validation({ custom: (fn) => fn });
}

describe('previous slugs field', () => {
	const validate = getValidator(previousSlugsField);

	it('accepts slugs as the website writes them', () => {
		expect(validate(['kurse', 'weitere-sportarten', '2er-gruppe'])).toBe(true);
	});

	it('accepts an empty list and a field that was never filled in', () => {
		expect(validate([])).toBe(true);
		expect(validate()).toBe(true);
	});

	it('rejects a slug with a leading slash', () => {
		expect(validate(['/kurse'])).toStrictEqual([{ message: SLUG_MESSAGE, path: [0] }]);
	});

	it('rejects a path where only the slug of the department belongs', () => {
		expect(validate(['/angebot/kurse/yoga'])).toStrictEqual([{ message: SLUG_MESSAGE, path: [0] }]);
		expect(validate(['kurse/yoga'])).toStrictEqual([{ message: SLUG_MESSAGE, path: [0] }]);
	});

	it('rejects a full URL', () => {
		expect(validate(['https://www.tsg-irlich.de/angebot/kurse'])).toStrictEqual([
			{ message: SLUG_MESSAGE, path: [0] },
		]);
	});

	it('rejects capitals, spaces and umlauts, which a slug never has', () => {
		expect(validate(['Kurse', ' kurse', 'fußball'])).toStrictEqual([
			{ message: SLUG_MESSAGE, path: [0] },
			{ message: SLUG_MESSAGE, path: [1] },
			{ message: SLUG_MESSAGE, path: [2] },
		]);
	});

	it('marks only the entries that are wrong', () => {
		expect(validate(['kurse', 'Tanzen', 'tanzen'])).toStrictEqual([
			{ message: SLUG_MESSAGE, path: [1] },
		]);
	});

	it('rejects an empty entry', () => {
		expect(validate([''])).toStrictEqual([{ message: SLUG_MESSAGE, path: [0] }]);
	});
});

describe('previous article slugs field', () => {
	const validate = getValidator(previousArticleSlugsField);

	it('is the same field as the history of the other types', () => {
		expect(previousArticleSlugsField.name).toBe('previousSlugs');
		expect(previousArticleSlugsField.title).toBe('Frühere Slugs');
	});

	it('accepts a slug as the website writes it', () => {
		expect(validate(['heimsieg-engers'])).toBe(true);
	});

	// Until WEB-421 no rule kept capitals out of an article slug, and their links have to redirect.
	it('accepts a former slug with capitals', () => {
		expect(validate(['Einladung-JHV-2026', 'niederlage-heimbach-II'])).toBe(true);
	});

	it('accepts an empty list and a field that was never filled in', () => {
		expect(validate([])).toBe(true);
		expect(validate()).toBe(true);
	});

	it('rejects the path of the article, which never matches a slug', () => {
		expect(validate(['/news/fussball/heimsieg-engers', 'fussball/heimsieg-engers'])).toStrictEqual([
			{ message: ARTICLE_MESSAGE, path: [0] },
			{ message: ARTICLE_MESSAGE, path: [1] },
		]);
	});

	it('rejects spaces, umlauts and an empty entry', () => {
		expect(validate(['heimsieg engers', 'fußball', ''])).toStrictEqual([
			{ message: ARTICLE_MESSAGE, path: [0] },
			{ message: ARTICLE_MESSAGE, path: [1] },
			{ message: ARTICLE_MESSAGE, path: [2] },
		]);
	});
});

describe('previous paths field', () => {
	const validate = getValidator(previousPathsField);

	it('accepts a department and a group slug', () => {
		expect(validate(['kurse/yoga', 'weitere-sportarten/1-mannschaft'])).toBe(true);
	});

	it('accepts an empty list and a field that was never filled in', () => {
		expect(validate([])).toBe(true);
		expect(validate()).toBe(true);
	});

	it('rejects a path with a leading slash', () => {
		expect(validate(['/kurse/yoga'])).toStrictEqual([{ message: PATH_MESSAGE, path: [0] }]);
	});

	it('rejects the path with /angebot in front', () => {
		expect(validate(['/angebot/kurse/yoga', 'angebot/kurse/yoga'])).toStrictEqual([
			{ message: PATH_MESSAGE, path: [0] },
			{ message: PATH_MESSAGE, path: [1] },
		]);
	});

	it('rejects a full URL', () => {
		expect(validate(['https://www.tsg-irlich.de/angebot/kurse/yoga'])).toStrictEqual([
			{ message: PATH_MESSAGE, path: [0] },
		]);
	});

	it('rejects capitals', () => {
		expect(validate(['Kurse/Yoga'])).toStrictEqual([{ message: PATH_MESSAGE, path: [0] }]);
	});

	it('rejects a lone slug and a trailing slash', () => {
		expect(validate(['kurse', 'kurse/'])).toStrictEqual([
			{ message: PATH_MESSAGE, path: [0] },
			{ message: PATH_MESSAGE, path: [1] },
		]);
	});

	it('marks only the entries that are wrong', () => {
		expect(validate(['kurse/yoga', 'Kurse/Pilates'])).toStrictEqual([
			{ message: PATH_MESSAGE, path: [1] },
		]);
	});
});
