import { describe, expect, it } from 'vite-plus/test';

import { departmentRedirectQuery } from './departments';

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
