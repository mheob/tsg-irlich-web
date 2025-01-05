import { RiLinksLine, RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { phoneFieldRegex } from '@/constants/regex';
import { meta } from '@/shared/field-groups';
import { metaField } from '@/shared/fields/meta';

const siteSettings = defineType({
	title: 'Generelle Einstellungen',
	name: 'site-settings',
	type: 'document',
	icon: RiSettings5Line,
	groups: [
		meta,
		{ name: 'contact', title: 'Kontakt' },
		{ name: 'misc', title: 'Misc' },
		{ name: 'navigation', title: 'Navigation' },
		{ name: 'social', title: 'Social' },
	],
	fields: [
		// meta
		metaField,

		defineField({
			title: 'Metadata Base',
			name: 'metadataBase',
			type: 'url',
			group: 'meta',
			description: (
				<a
					href="https://docs.astro.build/en/reference/api-reference/#astrourl"
					rel="noreferrer noopener"
					target="_blank"
				>
					Mehr Informationen
				</a>
			),
		}),

		// contact
		defineField({
			title: 'Kontakt',
			name: 'contact',
			type: 'object',
			group: 'contact',
			fields: [
				defineField({
					title: 'Adresse',
					name: 'address',
					type: 'string',
					description: 'Adresse (Straße Hausnummer, Postleitzahl Ort)',
					validation: Rule => [Rule.required().error('Die Adresse ist erforderlich')],
				}),

				defineField({
					title: 'Telefonnummer',
					name: 'phone',
					type: 'string',
					description: 'Telefonnummer',
					validation: Rule => [
						Rule.required().error('Die Telefonnummer ist erforderlich'),
						Rule.regex(phoneFieldRegex).error(
							'Telefonnummer ist ungültig, sie muss wie folgt aussehen: +49 123 456789',
						),
					],
				}),

				defineField({
					title: 'E-Mail',
					name: 'email',
					type: 'string',
					description: 'E-Mail',
					validation: Rule => [Rule.required().error('Die E-Mail ist erforderlich')],
				}),
			],
		}),

		// misc
		defineField({
			title: 'Newsletter',
			name: 'newsletter',
			type: 'object',
			icon: RiLinksLine,
			group: 'misc',
			fields: [
				defineField({
					title: 'Titel',
					name: 'title',
					type: 'string',
					description: 'Titel des Newsletters',
					validation: Rule => [Rule.required().error('Der "Newsletter Titel" ist erforderlich')],
				}),

				defineField({
					title: 'Button Text',
					name: 'cta',
					type: 'string',
					description: 'Text für den Newsletter Absende-Button',
					validation: Rule => [
						Rule.required()
							.min(3)
							.error('Der "Newsletter Button Text" muss mindestens 3 Zeichen lang sein'),
						Rule.max(18).warning(
							'Der "Newsletter Button Text" sollte nicht länger als 18 Zeichen sein',
						),
					],
				}),
			],
		}),

		// navigation
		defineField({
			title: 'Hauptmenü',
			name: 'mainNavigation',
			type: 'array',
			of: [
				{ title: 'Internal Link', type: 'internalLink' },
				{ title: 'External Link', type: 'externalLink' },
			],
			description: 'Seiten und/oder Links für die Hauptnavigation hinzufügen',
			group: 'navigation',
		}),

		defineField({
			title: 'Rechtliches Menü',
			name: 'legalNavigation',
			type: 'array',
			of: [{ title: 'Internal Link', type: 'internalLink' }],
			description: 'Seiten für das rechtliches Menü hinzufügen',
			group: 'navigation',
		}),

		// social
		defineField({
			title: 'Social Media',
			name: 'socialFields',
			type: 'socialFields',
			description: 'Social media',
			group: 'social',
		}),
	],
	preview: {
		prepare: () => ({ title: 'Generelle Einstellungen' }),
	},
});

export default siteSettings;
