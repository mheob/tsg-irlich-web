import type { defineField } from 'sanity';

/**
 * Returns a copy of a Sanity field definition with the `group` property set to the specified value.
 *
 * This is useful when you want to reuse a field definition and assign it to a specific group
 * within a schema.
 *
 * @param field - The field definition returned by `defineField`.
 * @param group - The group name to assign to the field.
 * @returns A new field definition object with the `group` property set.
 */
export function getFieldWithGroup(
	field: ReturnType<typeof defineField>,
	group: string,
): ReturnType<typeof defineField> {
	return { ...field, group };
}

/**
 * Returns a copy of a Sanity field definition with the `group` property set to undefined.
 *
 * This is useful when you want to reuse a field definition but remove its group association,
 * for example to place it outside of grouped field sections in a schema.
 *
 * @param field - The field definition returned by `defineField`.
 * @returns A new field definition object with `group` set to undefined.
 */
export function getFieldWithoutGroup(
	field: ReturnType<typeof defineField>,
): ReturnType<typeof defineField> {
	return { ...field, group: undefined };
}
