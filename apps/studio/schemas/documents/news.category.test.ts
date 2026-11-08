import { isValidElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vite-plus/test';

import { DOSB_ICONS } from '@tsgi-web/shared';

import { formattedSlugField } from '@/shared/fields/general';
import { previousSlugsField } from '@/shared/fields/slug-history';
import { CLUB_ICON_NAMES } from '@/utils/preview-icon';

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

interface CategoryPreviewSelection {
	readonly icon?: string;
	readonly title?: string;
}

function prepareCategoryPreview(selection: CategoryPreviewSelection): PreviewValue {
	return (
		newsCategory.preview.prepare as unknown as (value: CategoryPreviewSelection) => PreviewValue
	)(selection);
}

describe('news category icon', () => {
	it('offers the DOSB pictograms and the club icons, and is optional', () => {
		const field = getCategoryField('icon') as CategoryField & {
			readonly options?: { readonly list?: readonly { readonly value: string }[] };
		};
		const values = field.options?.list?.map((option) => option.value);

		expect(field.group).toBe('general');
		expect(field.validation).toBeUndefined();
		expect(values).toStrictEqual([...DOSB_ICONS, ...CLUB_ICON_NAMES]);
	});

	it('shows the chosen icon in the preview', () => {
		const { media, title } = prepareCategoryPreview({ icon: 'Presse', title: 'PR-Team' });

		expect(title).toBe('PR-Team');
		expect(isValidElement(media)).toBe(true);
		expect(renderToStaticMarkup(media as ReactElement)).toMatch(/^<svg/u);
	});

	// The studio then falls back to the icon of the type.
	it('leaves the media empty without an icon', () => {
		expect(prepareCategoryPreview({ title: 'Jugend' }).media).toBeUndefined();
	});

	it('reads the icon from the icon field', () => {
		expect(newsCategory.preview.select).toMatchObject({ icon: 'icon', title: 'title' });
	});
});
