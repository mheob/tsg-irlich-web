import { RiLinksLine, RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { meta } from '@/shared/field-groups';
import { metaField } from '@/shared/fields/meta';
import {
	maxLengthRule,
	minLengthRule,
	phoneFieldRegexRule,
	requiredRule,
} from '@/shared/validation-rules';

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
					validation: rule => [requiredRule(rule, 'Die Adresse')],
				}),

				defineField({
					title: 'Telefonnummer',
					name: 'phone',
					type: 'string',
					description: 'Telefonnummer',
					validation: rule => [requiredRule(rule, 'Die Telefonnummer'), phoneFieldRegexRule(rule)],
				}),

				defineField({
					title: 'E-Mail',
					name: 'email',
					type: 'string',
					description: 'E-Mail',
					validation: rule => [requiredRule(rule, 'Die E-Mail')],
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
					validation: rule => [requiredRule(rule, 'Der "Newsletter Titel"')],
				}),

				defineField({
					title: 'Button Text',
					name: 'cta',
					type: 'string',
					description: 'Text für den Newsletter Absende-Button',
					validation: rule => [
						minLengthRule(rule, 3, 'Der "Newsletter Button Text"'),
						maxLengthRule(rule, 18, 'Der "Newsletter Button Text"'),
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
