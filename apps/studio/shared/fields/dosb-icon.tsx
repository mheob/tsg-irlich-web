import { Text } from '@sanity/ui';
import { defineField } from 'sanity';

import { DOSB_ICONS } from '@tsgi-web/shared';

import { withRichDescription } from '@/components/rich-field-description';

const iconFieldDescription = withRichDescription(
	<Text muted size={1}>
		Wir nutzen die{' '}
		<a
			href="https://www.dosb.de/service/piktogramme/piktogramme-downloads"
			rel="noreferrer noopener"
			target="_blank"
		>
			Sportdeutschland-Piktogramme
		</a>
		. Sollte ein Icon in der Liste fehlen, kontaktiere bitte den Webmaster, damit er es hinzufügen
		kann.
	</Text>,
);

/** The required DOSB pictogram of a department or group. */
const dosbIconField = defineField({
	components: { field: iconFieldDescription },
	name: 'icon',
	options: {
		list: DOSB_ICONS.map((dosbIcon) => ({ title: dosbIcon, value: dosbIcon })),
	},
	title: 'Icon',
	type: 'string',
	validation: (Rule) => [Rule.required().error('Icon ist erforderlich')],
});

export { dosbIconField };
