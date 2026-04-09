import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { contactPersonsField } from '@/shared/fields/contact';
import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';
import { getFieldWithoutGroup } from '@/utils/fields';

export const contactPersonsSectionField = defineField({
	fields: [...getDefaultPageSectionFieldsWithGroup(), getFieldWithoutGroup(contactPersonsField)],
	group: 'contactPersons',
	icon: RiLinksLine,
	name: 'contactPersonsSection',
	title: 'Ansprechpartner',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Ansprechpartner ist erforderlich')],
});
