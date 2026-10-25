import { describe, expect, it } from 'vite-plus/test';

import { appendToHistory, getSlugHistoryPatch } from './slug-history';

describe('slug history of a value', () => {
	it('records the published slug when the slug changes', () => {
		expect(appendToHistory(undefined, 'fussball', 'fussball-und-mehr')).toStrictEqual(['fussball']);
	});

	it('records nothing for a document that was never published', () => {
		expect(appendToHistory(['alt'], undefined, 'neu')).toBeUndefined();
	});

	it('records nothing when the slug stays', () => {
		expect(appendToHistory([], 'kurse', 'kurse')).toBeUndefined();
	});

	it('never records a value twice', () => {
		expect(appendToHistory(['alt'], 'alt', 'neu')).toBeUndefined();
	});

	it('drops the new slug from the history when an editor switches back', () => {
		expect(appendToHistory(['kurse'], 'fitness', 'kurse')).toStrictEqual(['fitness']);
	});

	it('keeps the earlier entries and appends the published slug', () => {
		expect(appendToHistory(['alt'], 'mittel', 'neu')).toStrictEqual(['alt', 'mittel']);
	});

	it('removes the new slug even when the published one is already recorded', () => {
		expect(appendToHistory(['alt', 'neu'], 'alt', 'neu')).toStrictEqual(['alt']);
	});
});

describe('slug history patch', () => {
	it('records the old path when a group moves to another department', () => {
		expect(
			getSlugHistoryPatch({
				type: 'group',
				published: { departmentSlug: 'kurse', slug: 'yoga' },
				draft: { departmentSlug: 'weitere-sportarten', slug: 'yoga' },
			}),
		).toStrictEqual({ previousPaths: ['kurse/yoga'] });
	});

	it('records the old path when a group changes its slug', () => {
		expect(
			getSlugHistoryPatch({
				type: 'group',
				published: { departmentSlug: 'kurse', slug: 'yoga' },
				draft: { departmentSlug: 'kurse', previousPaths: ['kurse/pilates'], slug: 'hatha-yoga' },
			}),
		).toStrictEqual({ previousPaths: ['kurse/pilates', 'kurse/yoga'] });
	});

	it('records nothing when the path of a group stays', () => {
		expect(
			getSlugHistoryPatch({
				type: 'group',
				published: { departmentSlug: 'kurse', slug: 'yoga' },
				draft: { departmentSlug: 'kurse', slug: 'yoga' },
			}),
		).toBeUndefined();
	});

	it('records the old slug of a department', () => {
		expect(
			getSlugHistoryPatch({
				type: 'department',
				published: { slug: 'tanz' },
				draft: { slug: 'tanzen' },
			}),
		).toStrictEqual({ previousSlugs: ['tanz'] });
	});

	it('records nothing for a department that was never published', () => {
		expect(getSlugHistoryPatch({ type: 'department', draft: { slug: 'tanzen' } })).toBeUndefined();
	});

	it('records nothing while the draft of a department has no slug', () => {
		expect(
			getSlugHistoryPatch({
				type: 'department',
				published: { slug: 'kurse' },
				draft: { previousSlugs: ['alt'] },
			}),
		).toBeUndefined();
	});

	it('records no path while the published group has no department slug', () => {
		expect(
			getSlugHistoryPatch({
				type: 'group',
				published: { slug: 'yoga' },
				draft: { departmentSlug: 'kurse', slug: 'yoga' },
			}),
		).toBeUndefined();
	});

	it('records no path while the draft group has no department slug', () => {
		expect(
			getSlugHistoryPatch({
				type: 'group',
				published: { departmentSlug: 'kurse', slug: 'yoga' },
				draft: { slug: 'yoga' },
			}),
		).toBeUndefined();
	});
});
