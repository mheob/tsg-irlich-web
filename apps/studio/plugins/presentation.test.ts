import { describe, expect, it, vi } from 'vite-plus/test';

import { LOCATION_QUERIES, mainDocuments } from './presentation';

// `env.ts` throws without the studio variables, and only the preview URL is read here.
vi.mock(import('@/env'), () => ({ previewUrl: 'http://localhost:3000' }));

/** The routes in the order the presentation tool tries them. */
const routes = mainDocuments.map((document) => document.route);

describe('main document routes', () => {
	it('tries a group before its department, because the department route is a prefix of it', () => {
		expect(routes.indexOf('/angebot/:group/:singleGroup')).toBeGreaterThanOrEqual(0);
		expect(routes.indexOf('/angebot/:group/:singleGroup')).toBeLessThan(
			routes.indexOf('/angebot/:group'),
		);
	});

	it('puts the offer routes before the news routes', () => {
		expect(routes).toStrictEqual([
			'/angebot/:group/:singleGroup',
			'/angebot/:group',
			'/news/:category/:slug',
			'/news/:category',
			'/news',
		]);
	});

	it('finds a group by its own slug and the slug of its department', () => {
		const group = mainDocuments.find(
			(document) => document.route === '/angebot/:group/:singleGroup',
		);

		expect(group).toHaveProperty(
			'filter',
			'_type == "group" && slug.current == $singleGroup && department->slug.current == $group',
		);
	});

	it('finds a department by its slug', () => {
		const department = mainDocuments.find((document) => document.route === '/angebot/:group');

		expect(department).toHaveProperty('filter', '_type == "department" && slug.current == $group');
	});
});

describe('location queries', () => {
	it('only resolve locations for document types that have a page', () => {
		expect(Object.keys(LOCATION_QUERIES).toSorted()).toStrictEqual([
			'department',
			'group',
			'news.article',
			'news.category',
		]);
	});

	it('shows a department on its own page and on the offer overview', () => {
		const query = LOCATION_QUERIES.department;

		expect(query).toContain('"href": "/angebot/" + slug.current');
		expect(query).toContain('{ "href": "/angebot", "title": "Alle Angebote" }');
	});

	it('shows a group on its own page and on the page of its department', () => {
		const query = LOCATION_QUERIES.group;

		expect(query).toContain('"href": "/angebot/" + department->slug.current + "/" + slug.current');
		expect(query).toContain('"href": "/angebot/" + department->slug.current,');
	});

	it('leave out a location whose slug is not set yet', () => {
		expect(LOCATION_QUERIES.department).toContain('defined(slug.current) =>');
		expect(LOCATION_QUERIES.group).toContain(
			'defined(slug.current) && defined(department->slug.current) =>',
		);
	});
});
