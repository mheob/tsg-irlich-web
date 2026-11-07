import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vite-plus/test';

import { formattedSlugField } from '@/shared/fields/general';
import { previousArticleSlugsField } from '@/shared/fields/slug-history';

import newsArticle from './news.article';

interface NewsArticleSelection {
	readonly media?: PreviewValue['media'];
	readonly publishedAt?: string;
	readonly title?: string;
}

interface ChainRule {
	error: (message: string) => ChainRule;
	max: (count: number) => ChainRule;
	required: () => ChainRule;
}

interface ArticleField {
	readonly group?: string;
	readonly name: string;
	readonly of?: readonly { readonly type: string }[];
	readonly type: string;
	readonly validation?: (rule: ChainRule) => unknown;
}

interface ValidatedField {
	readonly validation?: unknown;
}

function prepareNewsArticle(selection: NewsArticleSelection): PreviewValue {
	return (newsArticle.preview.prepare as unknown as (value: NewsArticleSelection) => PreviewValue)(
		selection,
	);
}

function getArticleField(name: string): ArticleField {
	const field = (newsArticle.fields as readonly ArticleField[]).find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected the news article to declare a "${name}" field.`);
	}
	return field;
}

/**
 * Runs the validation of a field against a rule that only writes down the calls it receives, which
 * is all a builder chain like `Rule.max(5).error(…)` leaves to look at.
 *
 * @param field - The field of the news article.
 * @returns The calls of the chain, in order, with their argument.
 */
function recordValidationChain(field: ArticleField): string[] {
	if (!field.validation) {
		throw new Error(`Expected the news article to validate its "${field.name}" field.`);
	}

	const calls: string[] = [];
	const rule: ChainRule = {
		error: (message) => {
			calls.push(`error: ${message}`);
			return rule;
		},
		max: (count) => {
			calls.push(`max: ${count}`);
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

describe('news article slug', () => {
	it('checks the format of the slug', () => {
		expect((getArticleField('slug') as ValidatedField).validation).toBe(
			(formattedSlugField as ValidatedField).validation,
		);
	});

	it('keeps its former slugs in the general group, right below the slug', () => {
		const names = (newsArticle.fields as readonly ArticleField[]).map((field) => field.name);
		const history = getArticleField('previousSlugs');

		expect(names.indexOf('previousSlugs')).toBe(names.indexOf('slug') + 1);
		expect(history.group).toBe('general');
		expect((history as ValidatedField).validation).toBe(
			(previousArticleSlugsField as ValidatedField).validation,
		);
	});
});

describe('news article downloads', () => {
	it('offers the PDF downloads in the content group, right after the sections', () => {
		const names = (newsArticle.fields as readonly ArticleField[]).map((field) => field.name);
		const downloads = getArticleField('downloads');

		expect(names.indexOf('downloads')).toBe(names.indexOf('body') + 1);
		expect(downloads.group).toBe('content');
		expect(downloads.type).toBe('array');
		expect(downloads.of?.map((member) => member.type)).toStrictEqual(['documentDownload']);
	});

	it('allows at most five downloads and requires none', () => {
		expect(recordValidationChain(getArticleField('downloads'))).toStrictEqual([
			'max: 5',
			'error: Maximal 5 Downloads dürfen gesetzt werden',
		]);
	});
});

describe('news article preview', () => {
	// The expected date prefix is hard-coded rather than produced by calling `formatDate` — its own
	// `YY-MM-DD` behavior for this exact timestamp is separately pinned in `utils/time.test.ts`.
	it('prefixes the title with the formatted publish date when one is set', () => {
		const media = 'media-asset-abc';

		const result = prepareNewsArticle({
			media,
			publishedAt: '2026-08-25T10:00:00.000Z',
			title: 'Sommerfest 2026',
		});

		expect(result).toStrictEqual({ media, title: '26-08-25 - Sommerfest 2026' });
	});

	it('leaves the title unprefixed when there is no publish date, even with media set', () => {
		const media = 'media-asset-abc';

		const result = prepareNewsArticle({ media, title: 'Entwurf' });

		expect(result).toStrictEqual({ media, title: 'Entwurf' });
	});

	it('passes an absent media selection through as undefined when a publish date is set', () => {
		const result = prepareNewsArticle({
			publishedAt: '2026-01-01T00:00:00.000Z',
			title: 'Neujahr',
		});

		expect(result).toStrictEqual({ media: undefined, title: '26-01-01 - Neujahr' });
	});

	it('passes the selected media through unchanged', () => {
		const media = 'media-asset-xyz';

		const result = prepareNewsArticle({
			media,
			publishedAt: '2026-01-01T00:00:00.000Z',
			title: 'Neujahr',
		});

		expect(result.media).toBe(media);
	});
});
