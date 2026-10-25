import type { GroupRedirectQueryResult } from '@/types/sanity.types';

/**
 * Where one candidate of `groupRedirectQuery` lives today. Both parts are checked rather than
 * trusted, because a path is only worth redirecting to when it names a department and a group.
 */
interface GroupRedirectCandidate {
	departmentSlug: null | string;
	slug: null | string;
}

/** The candidates of `groupRedirectQuery`, one per way a group address goes out of date. */
type GroupRedirectMatch = Record<keyof GroupRedirectQueryResult, GroupRedirectCandidate | null>;

/**
 * Picks the address a former group path redirects to.
 *
 * The candidates are tried from the narrowest change to the widest: only the department was
 * renamed, then the group recorded the old path itself, then both changed.
 *
 * @param match - The candidates `groupRedirectQuery` found, or `null` when it found nothing.
 * @returns The current path of the first complete candidate, or `undefined` when there is none.
 */
function resolveGroupRedirect(match: GroupRedirectMatch | null): string | undefined {
	if (!match) {
		return undefined;
	}

	for (const candidate of [match.inDepartment, match.byPreviousPath, match.byDepartmentHistory]) {
		if (candidate?.departmentSlug && candidate.slug) {
			return `/angebot/${candidate.departmentSlug}/${candidate.slug}`;
		}
	}

	return undefined;
}

export { resolveGroupRedirect };
