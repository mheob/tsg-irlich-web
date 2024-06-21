import { RiLinksLine, RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { meta } from '@/shared/field-groups';
import { metaField } from '@/shared/fields/meta';
import { getMaxLengthRule, getMinLengthRule, getRequiredRole } from '@/shared/validation-rules';

const siteSettings = defineType({
	title: 'Generelle Einstellungen',
	name: 'site-settings',
	type: 'document',
	icon: RiSettings5Line,
	groups: [
		meta,
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
					href="https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase"
					rel="noreferrer noopener"
					target="_blank"
				>
					Mehr Informationen
				</a>
			),
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
					validation: rule => [getRequiredRole(rule, '"Newsletter Titel"')],
				}),

				defineField({
					title: 'Button Text',
					name: 'cta',
					type: 'string',
					description: 'Text für den Newsletter Absende-Button',
					validation: rule => [
						getMinLengthRule(rule, 3, '"Newsletter Button Text"'),
						getMaxLengthRule(rule, 18, '"Newsletter Button Text"'),
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
