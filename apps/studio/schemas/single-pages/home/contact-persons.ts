import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { contactPersonsField } from '@/shared/content-fields';
import { getDefaultPageFieldsWithGroup } from '@/shared/general-fields';

const contactPersonsSectionField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersonsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'contactPersons',
	fields: [...getDefaultPageFieldsWithGroup(), { ...contactPersonsField, group: undefined }],
});

export default contactPersonsSectionField;
