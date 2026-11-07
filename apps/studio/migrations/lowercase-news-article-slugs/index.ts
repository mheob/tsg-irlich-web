import { at, defineMigration, set } from 'sanity/migrate';

interface SlugPatch {
	previousSlugs: string[];
	slug: string;
}

/**
 * Works out the lowercase slug of an article and the history that keeps its old address alive.
 *
 * Until WEB-421 nothing checked the slug of an article, and some were published with capitals
 * (`Einladung-JHV-2026`). Their lowercase address answered 404, and the new slug rule rejects them.
 * The old slug goes into `previousSlugs`, so every link that was shared still redirects.
 *
 * @param slug - The current slug of the article.
 * @param previousSlugs - The former slugs recorded so far.
 * @returns The new slug and history, or `undefined` when the slug has no capitals.
 */
function getLowercaseSlugPatch(slug: unknown, previousSlugs?: unknown): SlugPatch | undefined {
	if (typeof slug !== 'string' || slug === slug.toLowerCase()) {
		return undefined;
	}

	const lowercase = slug.toLowerCase();
	const history = Array.isArray(previousSlugs)
		? previousSlugs.filter((entry): entry is string => typeof entry === 'string')
		: [];
	const next = history.filter((entry) => entry !== lowercase);
	if (!next.includes(slug)) {
		next.push(slug);
	}

	return { previousSlugs: next, slug: lowercase };
}

export default defineMigration({
	documentTypes: ['news.article'],
	migrate: {
		document({ previousSlugs, slug }) {
			const current =
				typeof slug === 'object' && slug !== null && 'current' in slug ? slug.current : undefined;
			const patch = getLowercaseSlugPatch(current, previousSlugs);

			// A slug without capitals stays as it is, which also makes a second run a no-op.
			if (!patch) {
				return [];
			}

			return [at('slug.current', set(patch.slug)), at('previousSlugs', set(patch.previousSlugs))];
		},
	},
	title: 'Großbuchstaben aus den Slugs der News-Artikel entfernen und alte Slugs merken',
});

export { getLowercaseSlugPatch };
