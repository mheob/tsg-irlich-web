import { defineField } from '@sanity-typed/types';
import { RiLinksLine } from 'react-icons/ri';

import { contactPersonsField } from '@/shared/fields/contact';
import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';

export const contactPersonsSectionField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersonsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'contactPersons',
	fields: [...getDefaultPageFieldsWithGroup(), { ...contactPersonsField, group: undefined }],
	validation: Rule => Rule.required().error('Ansprechpartner sind erforderlich.'),
});
