import { describe, expect, it } from 'vite-plus/test';

import department, { prepareDepartmentPreview } from './department';

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

	it('starts with team sport switched off', () => {
		const isTeamSport = department.fields.find((field) => field.name === 'isTeamSport');

		expect(isTeamSport).toMatchObject({ initialValue: false, type: 'boolean' });
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
