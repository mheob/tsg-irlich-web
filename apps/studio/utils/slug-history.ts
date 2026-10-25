/** What `getSlugHistoryPatch` needs to know about a department or a group. */
type SlugHistoryInput =
	| {
			draft: { previousSlugs?: string[]; slug?: string };
			published?: { slug?: string };
			type: 'department';
	  }
	| {
			draft: { departmentSlug?: string; previousPaths?: string[]; slug?: string };
			published?: { departmentSlug?: string; slug?: string };
			type: 'group';
	  };

/**
 * Adds the published value to a history, so its old URL can redirect to the new one.
 *
 * - Nothing is recorded for a document that was never published, or when the value stays.
 * - The value the draft switches to is removed from the history, because it is current again. That
 *   only applies while the new value is known: a group that moves into a department nobody has
 *   published yet has no new path, but its old one is gone all the same and is recorded.
 * - A value is never recorded twice.
 *
 * @param history - The values recorded so far.
 * @param publishedValue - The value of the published document.
 * @param nextValue - The value of the draft that is about to be published, left out while it cannot
 * be worked out.
 * @returns The new history, or `undefined` when it stays as it is.
 */
function appendToHistory(
	history: readonly string[] | undefined,
	publishedValue: string | undefined,
	nextValue?: string,
): string[] | undefined {
	if (!publishedValue || publishedValue === nextValue) {
		return undefined;
	}

	const current = history ?? [];
	const next = current.filter((value) => value !== nextValue);
	if (!next.includes(publishedValue)) {
		next.push(publishedValue);
	}

	const isUnchanged =
		next.length === current.length && next.every((value, i) => value === current[i]);
	return isUnchanged ? undefined : next;
}

/**
 * The path a group is served under, which is only known while both of its parts are.
 *
 * @param departmentSlug - The slug of the department of the group.
 * @param slug - The slug of the group.
 * @returns `<department slug>/<group slug>`, or `undefined` if one part is missing.
 */
function getGroupPath(
	departmentSlug: string | undefined,
	slug: string | undefined,
): string | undefined {
	return departmentSlug && slug ? `${departmentSlug}/${slug}` : undefined;
}

/**
 * Works out what a department or a group has to remember when its draft is published: the former
 * slug of a department, or the former `<department slug>/<group slug>` path of a group.
 *
 * A group whose new path is not known yet, because its department only exists as a draft, still
 * records the old path. The caller only asks when the department or the slug of the group changed.
 *
 * @param input - The type, the published values and the values of the draft.
 * @returns The fields to set on the draft, or `undefined` when there is nothing to remember.
 */
function getSlugHistoryPatch(input: SlugHistoryInput): Record<string, string[]> | undefined {
	if (input.type === 'department') {
		if (!input.draft.slug) {
			// A department's slug is required, so a draft without one is not about to be published.
			return undefined;
		}

		const previousSlugs = appendToHistory(
			input.draft.previousSlugs,
			input.published?.slug,
			input.draft.slug,
		);
		return previousSlugs && { previousSlugs };
	}

	const previousPaths = appendToHistory(
		input.draft.previousPaths,
		getGroupPath(input.published?.departmentSlug, input.published?.slug),
		getGroupPath(input.draft.departmentSlug, input.draft.slug),
	);
	return previousPaths && { previousPaths };
}

export type { SlugHistoryInput };
export { appendToHistory, getSlugHistoryPatch };
