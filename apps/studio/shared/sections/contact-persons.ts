import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { contactPersonsField } from '@/shared/fields/contact';
import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';
import { requiredRule } from '@/shared/validation-rules';

export const contactPersonsSectionField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersonsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'contactPersons',
	fields: [...getDefaultPageFieldsWithGroup(), { ...contactPersonsField, group: undefined }],
	validation: rule => [requiredRule(rule, 'Ansprechpartner')],
});
