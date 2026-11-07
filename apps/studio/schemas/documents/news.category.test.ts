import { describe, expect, it } from 'vite-plus/test';

import { formattedSlugField } from '@/shared/fields/general';
import { previousSlugsField } from '@/shared/fields/slug-history';

import newsCategory from './news.category';

interface CategoryField {
	readonly group?: string;
	readonly name: string;
	readonly validation?: unknown;
}

function getCategoryField(name: string): CategoryField {
	const field = (newsCategory.fields as readonly CategoryField[]).find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected the news category to declare a "${name}" field.`);
	}
	return field;
}

describe('news category slug', () => {
	it('checks the format of the slug', () => {
		expect(getCategoryField('slug').validation).toBe(formattedSlugField.validation);
	});

	it('keeps its former slugs in the general group, right below the slug', () => {
		const names = (newsCategory.fields as readonly CategoryField[]).map((field) => field.name);
		const history = getCategoryField('previousSlugs');

		expect(names.indexOf('previousSlugs')).toBe(names.indexOf('slug') + 1);
		expect(history.group).toBe('general');
		expect(history.validation).toBe(previousSlugsField.validation);
	});
});
