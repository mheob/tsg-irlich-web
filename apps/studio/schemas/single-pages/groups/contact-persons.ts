import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const contactPersonsField = defineField({
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	group: 'contactPersons',
	icon: RiLinksLine,
	name: 'contactPersonsSection',
	title: 'Ansprechpartner',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Ansprechpartner sind erforderlich')],
});
