import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { getSinglePagePreview } from '@/utils/previews';

const contactPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('kontakt'),

		// General
		...defaultHeroFields,
		getHeroImageField(`${LANDSCAPE_HERO_DESCRIPTION} Erscheint auch auf der Feedback-Seite.`),

		// Meta
		metaField,

		// Content
		defineField({
			fields: [
				defineField({
					description: 'Personen oder Bereiche, die im Kontaktformular kontaktiert werden können.',
					name: 'receiver',
					of: [{ type: 'contactNameMail' }],
					title: 'Kontakt zu',
					type: 'array',
					validation: (Rule) => [Rule.required().error('Das Feld "Kontakt zu" ist erforderlich')],
				}),
				contactPersonsSectionField,
			],
			group: 'content',
			groups: [{ name: 'contactPersons', title: 'Ansprechpartner' }],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	groups: [general, meta, content],
	icon: RiBookletLine,
	name: 'contact',
	preview: getSinglePagePreview('Kontakt'),
	title: 'Kontakt',
	type: 'document',
});

export default contactPage;
