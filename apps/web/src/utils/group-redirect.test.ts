import { describe, expect, it } from 'vite-plus/test';

import { resolveGroupRedirect } from '@/utils/group-redirect';

describe('resolving the redirect of a former group path', () => {
	it('follows a renamed department', () => {
		expect(
			resolveGroupRedirect({
				inDepartment: { departmentSlug: 'tanzen', slug: 'kids' },
				byPreviousPath: null,
				byDepartmentHistory: null,
			}),
		).toBe('/angebot/tanzen/kids');
	});

	it('follows a group that moved or was renamed', () => {
		expect(
			resolveGroupRedirect({
				inDepartment: null,
				byPreviousPath: { departmentSlug: 'kurse', slug: 'yoga' },
				byDepartmentHistory: null,
			}),
		).toBe('/angebot/kurse/yoga');
	});

	it('follows a group whose department and own path both changed', () => {
		expect(
			resolveGroupRedirect({
				inDepartment: null,
				byPreviousPath: null,
				byDepartmentHistory: { departmentSlug: 'turnen', slug: 'eltern-kind' },
			}),
		).toBe('/angebot/turnen/eltern-kind');
	});

	it('prefers the renamed department over an old path', () => {
		expect(
			resolveGroupRedirect({
				inDepartment: { departmentSlug: 'tanzen', slug: 'kids' },
				byPreviousPath: { departmentSlug: 'kurse', slug: 'kindertanz' },
				byDepartmentHistory: null,
			}),
		).toBe('/angebot/tanzen/kids');
	});

	it('prefers an old path over the history of the department', () => {
		expect(
			resolveGroupRedirect({
				inDepartment: null,
				byPreviousPath: { departmentSlug: 'kurse', slug: 'yoga' },
				byDepartmentHistory: { departmentSlug: 'turnen', slug: 'eltern-kind' },
			}),
		).toBe('/angebot/kurse/yoga');
	});

	it('ignores a candidate without department slug', () => {
		expect(
			resolveGroupRedirect({
				inDepartment: { departmentSlug: null, slug: 'x' },
				byPreviousPath: null,
				byDepartmentHistory: null,
			}),
		).toBeUndefined();
	});

	it('skips an incomplete candidate in favour of the next one', () => {
		expect(
			resolveGroupRedirect({
				inDepartment: { departmentSlug: null, slug: 'kids' },
				byPreviousPath: { departmentSlug: 'kurse', slug: 'yoga' },
				byDepartmentHistory: null,
			}),
		).toBe('/angebot/kurse/yoga');
	});

	it('finds nothing when every candidate is empty', () => {
		expect(
			resolveGroupRedirect({ inDepartment: null, byPreviousPath: null, byDepartmentHistory: null }),
		).toBeUndefined();
	});

	it('finds nothing without candidates', () => {
		expect(resolveGroupRedirect(null)).toBeUndefined();
	});
});
