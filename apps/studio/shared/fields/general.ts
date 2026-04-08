// oxlint-disable no-magic-numbers

import { defineField } from 'sanity';

import { slugify } from '@/utils/strings';

/**
 * A hidden slug field for a document.
 *
 * @param slug - The slug to set as the initial value.
 * @returns The hidden slug field.
 */
function getHiddenSlugField(slug: string): ReturnType<typeof defineField> {
	return defineField({
		group: 'general',
		hidden: false,
		initialValue: { current: slug },
		name: 'slug',
		readOnly: true,
		title: 'Slug',
		type: 'slug',
	});
}

const introField = defineField({
	group: 'general',
	name: 'intro',
	title: 'Intro',
	type: 'text',
});

const slugField = defineField({
	description: 'Ein Slug muss gesetzt werden, um die Seite anzeigen zu können.',
	group: 'general',
	name: 'slug',
	options: {
		slugify,
		source: 'title',
	},
	title: 'Slug',
	type: 'slug',
	validation: (Rule) => [Rule.required().error('Die Slug ist erforderlich')],
});

const subTitleField = defineField({
	group: 'general',
	name: 'subtitle',
	title: 'Untertitel',
	type: 'string',
	validation: (Rule) => [
		Rule.required().min(3).error('Der Untertitel muss mindestens 3 Zeichen lang sein'),
		Rule.max(50).warning('Der Untertitel sollte nicht länger als 50 Zeichen sein'),
	],
});

const titleField = defineField({
	group: 'general',
	name: 'title',
	title: 'Titel',
	type: 'string',
	validation: (Rule) => [
		Rule.required().min(3).error('Der Titel muss mindestens 3 Zeichen lang sein'),
		Rule.max(65).warning('Der Titel sollte nicht länger als 65 Zeichen sein'),
	],
});

const defaultHeroFields = [titleField, subTitleField];

const defaultPageSectionFields = [titleField, subTitleField, introField];

/**
 * Returns the default page section fields with the specified group.
 *
 * @param group - The group to add the fields to.
 * @returns The default page section fields with the specified group.
 */
function getDefaultPageSectionFieldsWithGroup(group?: string): ReturnType<typeof defineField>[] {
	return defaultPageSectionFields.map((field) => ({ ...field, group }));
}

/**
 * Removes the group from a field.
 *
 * @param field - The field to remove the group from.
 * @returns The field with the group removed.
 */
function removeGroupFromField(
	field: ReturnType<typeof defineField>,
): ReturnType<typeof defineField> {
	return { ...field, group: undefined };
}

export {
	defaultHeroFields,
	defaultPageSectionFields,
	getHiddenSlugField,
	getDefaultPageSectionFieldsWithGroup,
	introField,
	removeGroupFromField,
	slugField,
	subTitleField,
	titleField,
};
