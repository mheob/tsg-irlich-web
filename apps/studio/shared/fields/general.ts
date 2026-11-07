// oxlint-disable no-magic-numbers

import { defineField } from 'sanity';

import { slugify } from '@/utils/strings';
import { validateLineSpacing } from '@/utils/whitespace';

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

/**
 * The shape of a slug the website can serve as it is: lowercase letters and digits, words joined by
 * single hyphens. A capital made an address that only worked as typed (WEB-421), and an umlaut or a
 * space has to be encoded in every link.
 */
const SLUG_FORMAT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const SLUG_FORMAT_MESSAGE =
	'Der Slug darf nur Kleinbuchstaben, Ziffern und einzelne Bindestriche enthalten, z. B. heimsieg-gegen-engers. „Generieren“ erzeugt ihn passend aus dem Titel.';

/**
 * Checks the shape of a slug. A missing slug passes, because the required rule already names it.
 *
 * @param value - The value of a slug field.
 * @param value.current - The slug itself.
 * @returns `true`, or the message for an editor.
 */
function validateSlugFormat(value?: { current?: string }): string | true {
	const slug = value?.current;
	return !slug || SLUG_FORMAT.test(slug) ? true : SLUG_FORMAT_MESSAGE;
}

/** The slug field plus the check of its shape, for the documents whose slug is checked. */
const formattedSlugField = defineField({
	...slugField,
	validation: (Rule) => [
		Rule.required().error('Die Slug ist erforderlich'),
		Rule.custom(validateSlugFormat),
	],
});

const subTitleField = defineField({
	group: 'general',
	name: 'subtitle',
	title: 'Untertitel',
	type: 'string',
	validation: (Rule) => [
		Rule.required().min(3).error('Der Untertitel muss mindestens 3 Zeichen lang sein'),
		Rule.max(50).warning('Der Untertitel sollte nicht länger als 50 Zeichen sein'),
		Rule.custom(validateLineSpacing),
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
		Rule.custom(validateLineSpacing),
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
	formattedSlugField,
	getHiddenSlugField,
	getDefaultPageSectionFieldsWithGroup,
	introField,
	removeGroupFromField,
	slugField,
	subTitleField,
	titleField,
	validateSlugFormat,
};
