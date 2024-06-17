import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/general-fields';

const pricingField = defineField({
	title: 'Preistabelle',
	name: 'pricingSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'pricing',
	fields: [
		...getDefaultPageFieldsWithGroup(),

		// TODO: add pricing fields
	],
});

export default pricingField;
