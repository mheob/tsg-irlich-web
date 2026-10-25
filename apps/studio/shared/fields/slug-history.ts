import { defineField } from 'sanity';

const SLUG_HISTORY_DESCRIPTION =
	'Wird beim Veröffentlichen automatisch gefüllt. Nach einer Veröffentlichung über einen Release hier den alten Wert von Hand eintragen.';

/** The slugs a department used to have, so their old URLs can redirect. */
const previousSlugsField = defineField({
	description: SLUG_HISTORY_DESCRIPTION,
	name: 'previousSlugs',
	of: [{ type: 'string' }],
	title: 'Frühere Slugs',
	type: 'array',
});

/** The `<department slug>/<group slug>` paths a group used to have, so their old URLs can redirect. */
const previousPathsField = defineField({
	description: SLUG_HISTORY_DESCRIPTION,
	name: 'previousPaths',
	of: [{ type: 'string' }],
	title: 'Frühere Adressen',
	type: 'array',
});

export { previousPathsField, previousSlugsField };
