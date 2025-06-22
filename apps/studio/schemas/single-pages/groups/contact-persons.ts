import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const contactPersonsField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersonsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'contactPersons',
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	validation: Rule => [Rule.required().error('Ansprechpartner sind erforderlich')],
});
