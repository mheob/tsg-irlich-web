import type { Affiliation } from './build';

/** The type a pending strengthening has to name once the group has its new id. */
const GROUP_TYPE = 'group';

/**
 * Whether a value is a plain object, the shape of every document part that is not an array.
 *
 * @param value - Any value of a document.
 * @returns `true` for an object that is no array.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Points one reference at its new id and keeps every other attribute (`_key`, `_weak`, …). A
 * pending strengthening (`_strengthenOnPublish`) names the type the studio checks on publish, so
 * that type becomes `group` as well.
 *
 * @param reference - The reference.
 * @param newId - The id it points at from now on.
 * @returns The rewritten reference.
 */
function rewriteReference(
	reference: Record<string, unknown>,
	newId: string,
): Record<string, unknown> {
	const strengthen = reference._strengthenOnPublish;
	return {
		...reference,
		_ref: newId,
		...(isRecord(strengthen) && strengthen.type !== undefined
			? { _strengthenOnPublish: { ...strengthen, type: GROUP_TYPE } }
			: {}),
	};
}

/**
 * Rewrites every reference to a legacy group, however deep it sits in objects and arrays. A part
 * without such a reference is handed back as the very same value, so a caller can tell by identity
 * whether anything changed.
 *
 * @param value - A document or any part of one.
 * @param newIdByLegacy - The new id per published legacy id, e.g. `soccer-1` → `group-soccer-1`.
 * @returns The value with the references rewritten.
 */
function rewriteReferences(value: unknown, newIdByLegacy: ReadonlyMap<string, string>): unknown {
	if (Array.isArray(value)) {
		const items = value.map((item: unknown) => rewriteReferences(item, newIdByLegacy));
		return items.some((item, index) => item !== value[index]) ? items : value;
	}
	if (!isRecord(value)) {
		return value;
	}
	const entries = Object.entries(value);
	const rewritten = entries.map(
		([key, item]) => [key, rewriteReferences(item, newIdByLegacy)] as const,
	);
	const inner = rewritten.some(([, item], index) => item !== entries[index]?.[1])
		? Object.fromEntries(rewritten)
		: value;
	const newId = typeof value._ref === 'string' ? newIdByLegacy.get(value._ref) : undefined;
	return newId ? rewriteReference(inner, newId) : inner;
}

/**
 * Whether a value references an id anywhere, like GROQ's `references()`.
 *
 * @param value - A document or any part of one.
 * @param id - The referenced id.
 * @returns `true` when a `_ref` somewhere in it is the id.
 */
function referencesId(value: unknown, id: string): boolean {
	if (Array.isArray(value)) {
		return value.some((item: unknown) => referencesId(item, id));
	}
	if (!isRecord(value)) {
		return false;
	}
	return value._ref === id || Object.values(value).some((item) => referencesId(item, id));
}

/**
 * Rewrites every reference to a legacy group in a document.
 *
 * @param document - The document.
 * @param newIdByLegacy - The new id per published legacy id.
 * @returns The document itself when nothing changed, otherwise a rewritten copy.
 */
function rewriteDocumentReferences(
	document: Record<string, unknown>,
	newIdByLegacy: ReadonlyMap<string, string>,
): Record<string, unknown> {
	const rewritten = rewriteReferences(document, newIdByLegacy);
	return isRecord(rewritten) ? rewritten : document;
}

/**
 * Whether a value is a list of affiliations as the studio stores them: objects with a `_key`.
 *
 * @param value - Any value of a document.
 * @returns `true` for such a list.
 */
function isAffiliationList(value: unknown): value is Affiliation[] {
	return (
		Array.isArray(value) && value.every((item) => isRecord(item) && typeof item._key === 'string')
	);
}

export { isAffiliationList, referencesId, rewriteDocumentReferences, rewriteReferences };
