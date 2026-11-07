import type { ValidationError } from 'sanity';
import { defineField } from 'sanity';

const SLUG_HISTORY_DESCRIPTION =
	'Wird beim Veröffentlichen automatisch gefüllt. Nach einer Veröffentlichung über einen Release hier den alten Wert von Hand eintragen.';

/** A slug the way the website writes it: lowercase letters, digits and hyphens. */
const SLUG_PATTERN = /^[a-z0-9-]+$/u;

/**
 * A slug of a news article as it may have been published. Until WEB-421 nothing checked the slug of
 * an article, and some went out with capitals (`Einladung-JHV-2026`), whose links still have to
 * redirect.
 */
const ARTICLE_SLUG_PATTERN = /^[a-zA-Z0-9-]+$/u;

/** `<department slug>/<group slug>`, without `/angebot` in front and without slashes around. */
const PATH_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/u;

const PREVIOUS_SLUG_MESSAGE = 'Bitte nur den Slug eintragen, z. B. kurse';
const PREVIOUS_ARTICLE_SLUG_MESSAGE =
	'Bitte nur den Slug ohne /news und Kategorie eintragen, z. B. heimsieg-gegen-engers';
const PREVIOUS_PATH_MESSAGE =
	'Bitte Abteilung und Gruppe ohne /angebot eintragen, z. B. kurse/yoga';

/**
 * Builds the check of a history field. Editors type old values by hand after a release or a
 * scheduled publish, and a value in the wrong shape never matches a URL, so the redirect would
 * silently not happen.
 *
 * @param pattern - The shape every entry has to have.
 * @param message - What the editor is told about an entry that does not match, with an example.
 * @returns A validator that marks every entry that does not match, or passes.
 */
function createHistoryValidator(
	pattern: RegExp,
	message: string,
): (values: readonly unknown[] | undefined) => true | ValidationError[] {
	return (values) => {
		const errors = (values ?? []).flatMap((value, index) =>
			typeof value === 'string' && pattern.test(value) ? [] : [{ message, path: [index] }],
		);
		return errors.length > 0 ? errors : true;
	};
}

/** The slugs a department or a news category used to have, so their old URLs can redirect. */
const previousSlugsField = defineField({
	description: SLUG_HISTORY_DESCRIPTION,
	name: 'previousSlugs',
	of: [{ type: 'string' }],
	title: 'Frühere Slugs',
	type: 'array',
	validation: (Rule) => Rule.custom(createHistoryValidator(SLUG_PATTERN, PREVIOUS_SLUG_MESSAGE)),
});

/**
 * The slugs a news article used to have, so their old URLs can redirect. The category is not part of
 * the entry: the website finds an article by its slug alone and sends any category to its first one.
 */
const previousArticleSlugsField = defineField({
	...previousSlugsField,
	validation: (Rule) =>
		Rule.custom(createHistoryValidator(ARTICLE_SLUG_PATTERN, PREVIOUS_ARTICLE_SLUG_MESSAGE)),
});

/** The `<department slug>/<group slug>` paths a group used to have, so their old URLs can redirect. */
const previousPathsField = defineField({
	description: SLUG_HISTORY_DESCRIPTION,
	name: 'previousPaths',
	of: [{ type: 'string' }],
	title: 'Frühere Adressen',
	type: 'array',
	validation: (Rule) => Rule.custom(createHistoryValidator(PATH_PATTERN, PREVIOUS_PATH_MESSAGE)),
});

export { previousArticleSlugsField, previousPathsField, previousSlugsField };
