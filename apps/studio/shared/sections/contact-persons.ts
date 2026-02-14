import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { contactPersonsField } from '@/shared/fields/contact';
import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';
import { getFieldWithoutGroup } from '@/utils/fields';

export const contactPersonsSectionField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersonsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'contactPersons',
	fields: [...getDefaultPageSectionFieldsWithGroup(), getFieldWithoutGroup(contactPersonsField)],
	validation: (Rule) => [Rule.required().error('Ansprechpartner ist erforderlich')],
});
