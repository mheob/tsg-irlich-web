import { defineField } from 'sanity';
import { describe, expect, it } from 'vitest';

import { getFieldWithGroup, getFieldWithoutGroup } from './fields';

type Field = ReturnType<typeof defineField>;

describe('field group copying', () => {
	it('sets the group on the returned copy', () => {
		const field: Field = defineField({ name: 'title', title: 'Title', type: 'string' });

		const result = getFieldWithGroup(field, 'content');

		expect(result.group).toBe('content');
	});

	it('does not mutate the source field and returns a different object', () => {
		const field: Field = defineField({ name: 'title', title: 'Title', type: 'string' });

		const result = getFieldWithGroup(field, 'content');

		expect(field.group).toBeUndefined();
		expect(result).not.toBe(field);
	});

	it('preserves every other property when adding a group', () => {
		const field: Field = defineField({
			description: 'The title of the thing',
			name: 'title',
			title: 'Title',
			type: 'string',
		});

		const result = getFieldWithGroup(field, 'content');

		expect(result).toStrictEqual({ ...field, group: 'content' });
	});

	it('clears an existing group', () => {
		const field: Field = defineField({
			group: 'content',
			name: 'title',
			title: 'Title',
			type: 'string',
		});

		const result = getFieldWithoutGroup(field);

		expect(result.group).toBeUndefined();
	});

	it('does not mutate the source field and returns a different object when clearing the group', () => {
		const field: Field = defineField({
			group: 'content',
			name: 'title',
			title: 'Title',
			type: 'string',
		});

		const result = getFieldWithoutGroup(field);

		expect(field.group).toBe('content');
		expect(result).not.toBe(field);
	});

	it('preserves every other property when clearing the group', () => {
		const field: Field = defineField({
			description: 'The title of the thing',
			group: 'content',
			name: 'title',
			title: 'Title',
			type: 'string',
		});

		const result = getFieldWithoutGroup(field);

		expect(result).toStrictEqual({ ...field, group: undefined });
	});
});
