import type { GroupSummary } from './store';

const DRAFTS_PREFIX = 'drafts.';
const VERSIONS_PREFIX = 'versions.';
const NEW_GROUP_PREFIX = 'group-';
/** `versions.<release id>.<published id>`; a release id carries no dot. */
const VERSION_ID = /^versions\.[^.]+\./u;

/**
 * Whether an id is the version of a document in a content release.
 *
 * @param id - The document id.
 * @returns `true` for `versions.<release>.<id>`.
 */
function isReleaseVersion(id: string): boolean {
	return id.startsWith(VERSIONS_PREFIX);
}

/**
 * Whether an id is the published one: neither a draft nor a release version.
 *
 * @param id - The document id.
 * @returns `false` for `drafts.<id>` and `versions.<release>.<id>`.
 */
function isPublished(id: string): boolean {
	return !id.startsWith(DRAFTS_PREFIX) && !isReleaseVersion(id);
}

/**
 * The published id behind a draft or release version id.
 *
 * @param id - A published, draft or release version id.
 * @returns The published id.
 */
function toPublishedId(id: string): string {
	if (id.startsWith(DRAFTS_PREFIX)) {
		return id.slice(DRAFTS_PREFIX.length);
	}
	return id.replace(VERSION_ID, '');
}

/**
 * The id a legacy `group.<x>` document moves to. Sanity never changes the `_type` of an id, so
 * the `group` gets an id of its own: `<id>` becomes `group-<id>`, its draft `drafts.group-<id>`.
 *
 * @param id - The published or draft id of the legacy group.
 * @returns The id of the `group` that replaces it.
 */
function toNewGroupId(id: string): string {
	const newId = `${NEW_GROUP_PREFIX}${toPublishedId(id)}`;
	return id.startsWith(DRAFTS_PREFIX) ? `${DRAFTS_PREFIX}${newId}` : newId;
}

/**
 * The department a `group` references.
 *
 * @param group - The group.
 * @returns The department id, or `undefined` when `department` is no reference.
 */
function departmentIdOf(group: GroupSummary): string | undefined {
	const { department } = group;
	return typeof department === 'object' && department?._ref ? department._ref : undefined;
}

/**
 * Whether a `group` is left over from the 2024 schema, which used the same type name: its
 * department is a string, or it has none but still carries `isSportGroup`, which the current
 * schema dropped. A group the current studio creates never matches, not even a draft whose
 * department is still empty.
 *
 * @param group - The group.
 * @returns `true` for a group from the 2024 schema.
 */
function isOrphanedGroup(group: GroupSummary): boolean {
	if (typeof group.department === 'string') {
		return true;
	}
	return !departmentIdOf(group) && group.isSportGroup !== undefined && group.isSportGroup !== null;
}

export {
	departmentIdOf,
	isOrphanedGroup,
	isPublished,
	isReleaseVersion,
	toNewGroupId,
	toPublishedId,
};
