import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { contactPersonsField } from '@/shared/fields/content';
import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';

export const contactPersonsSectionField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersonsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'contactPersons',
	fields: [...getDefaultPageFieldsWithGroup(), { ...contactPersonsField, group: undefined }],
});
