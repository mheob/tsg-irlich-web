import { describe, expect, it } from 'vite-plus/test';

import { departmentPageQuery, departmentRedirectQuery } from './departments';

describe('department redirect query', () => {
	// Two departments may list the same former slug, for instance when one was handed back and
	// forth. The pick has to be the same on every request, so the tie is broken by the id.
	it('picks the most recently updated department and breaks a tie by id', () => {
		expect(departmentRedirectQuery).toMatch(/\| order\(_updatedAt desc, _id asc\)\[0\]/u);
	});

	it('answers with the current slug of the department', () => {
		expect(departmentRedirectQuery).toContain('[0].slug.current');
	});
});

describe('department page query', () => {
	// An answer that links to a department references it too, so `references()` would put the
	// question on that department's page. Only the departments field decides.
	it('picks the FAQ of a department by its departments field, not by any reference', () => {
		expect(departmentPageQuery).toContain("_type == 'faq' && ^._id in departments[]._ref");
		expect(departmentPageQuery).not.toContain('references(');
	});

	it('orders the FAQ by sort order, then by question', () => {
		expect(departmentPageQuery).toContain('order(sortOrder asc, question asc)');
	});

	it('reads the answer as plain text and whether this department comes first', () => {
		expect(departmentPageQuery).toContain('"answerText": pt::text(answer)');
		expect(departmentPageQuery).toContain('"isMarkedUp": departments[0]._ref == ^._id');
	});
});
