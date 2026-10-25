import { ADMIN_LEGACY_AFFILIATION } from './seeds';
import type { DepartmentImages, DepartmentSeed } from './seeds';

/** What a legacy group loses on its way to `group`: the revision is the lake's, the flag is gone. */
const DROPPED_GROUP_FIELDS = new Set(['_rev', '_updatedAt', 'isSportGroup']);
/** What an `admin` affiliation loses: the board belongs to no department and no group. */
const DROPPED_ADMIN_FIELDS = new Set(['department', 'team']);

/**
 * A strong reference to a document.
 *
 * @param id - The published id of the target.
 * @returns The reference.
 */
function toReference(id: string): Reference {
	return { _ref: id, _type: 'reference' };
}

/**
 * Copies an object without the given keys.
 *
 * @param value - The object.
 * @param keys - The keys to leave out.
 * @returns The copy.
 */
function omit<T extends object>(value: T, keys: ReadonlySet<string>): Partial<T> {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the entries come from `value`
	return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.has(key))) as Partial<T>;
}

/**
 * An image field value with an alt text.
 *
 * @param type - `extendedImage`, or `image` for the open graph image.
 * @param assetId - The uploaded asset.
 * @param alt - The alt text.
 * @returns The image value.
 */
function toImage<Type extends string>(type: Type, assetId: string, alt: string): ImageValue<Type> {
	return { _type: type, alt, asset: toReference(assetId) };
}

/**
 * Builds a department document from its seed, the uploaded images, the shared stats of the groups
 * page and today's contact persons.
 *
 * @param seed - The department.
 * @param assetIds - The asset ids of its card, hero and open graph image.
 * @param stats - The stats to copy; each copy gets a key of its own.
 * @param contactPersonIds - The published ids of its contact persons, in their order.
 * @returns The document.
 */
// oxlint-disable-next-line max-params -- the four inputs are unrelated; the plan names this signature
function buildDepartmentDocument(
	seed: DepartmentSeed,
	assetIds: DepartmentImages,
	stats: readonly StatsItem[],
	contactPersonIds: readonly string[],
): DepartmentDocument {
	return {
		_id: seed.id,
		_type: 'department',
		cardImage: toImage('extendedImage', assetIds.card, seed.title),
		contactPersons: contactPersonIds.map((id) => ({ ...toReference(id), _key: id })),
		heroImage: toImage('extendedImage', assetIds.hero, seed.title),
		icon: seed.icon,
		isTeamSport: seed.isTeamSport,
		meta: {
			_type: 'metaFields',
			openGraphImage: toImage('image', assetIds.openGraph, seed.title),
		},
		slug: { _type: 'slug', current: seed.slug },
		sortOrder: seed.sortOrder,
		stats: stats.map((item, index) => ({ ...item, _key: `${seed.slug}-stat-${index + 1}` })),
		title: seed.title,
	};
}

/**
 * Turns a legacy `group.<x>` document into a `group` with the same id and every content field.
 *
 * @param legacy - The legacy document, published or draft.
 * @param departmentId - The id of the department it belongs to.
 * @returns The document that replaces it.
 */
function toGroupDocument(legacy: LegacyGroupDocument, departmentId: string): GroupDocument {
	return {
		...omit(legacy, DROPPED_GROUP_FIELDS),
		_id: legacy._id,
		_type: 'group',
		department: toReference(departmentId),
	};
}

/**
 * Migrates one affiliation, and hands back the very same object when nothing changes.
 *
 * @param affiliation - The affiliation.
 * @param departmentIdByLegacy - The department id per legacy string.
 * @returns The migrated affiliation.
 */
function migrateAffiliation(
	affiliation: Affiliation,
	departmentIdByLegacy: ReadonlyMap<string, string>,
): Affiliation {
	const { department } = affiliation;
	if (typeof department !== 'string') {
		return affiliation;
	}
	if (department === ADMIN_LEGACY_AFFILIATION) {
		return { ...omit(affiliation, DROPPED_ADMIN_FIELDS), _key: affiliation._key };
	}
	const departmentId = departmentIdByLegacy.get(department);
	return departmentId ? { ...affiliation, department: toReference(departmentId) } : affiliation;
}

/**
 * Replaces the legacy department strings of a person's affiliations. `admin` loses its department
 * and its group and keeps the rest. An unknown string stays as it is, for the caller to report.
 *
 * @param affiliations - The affiliations as stored.
 * @param departmentIdByLegacy - The department id per legacy string, e.g. `soccer` →
 *   `department-fussball`.
 * @returns The migrated affiliations, or `undefined` when nothing changes.
 */
function migrateAffiliations(
	affiliations: readonly Affiliation[] | null | undefined,
	departmentIdByLegacy: ReadonlyMap<string, string>,
): Affiliation[] | undefined {
	if (!affiliations) {
		return undefined;
	}
	const migrated = affiliations.map((affiliation) =>
		migrateAffiliation(affiliation, departmentIdByLegacy),
	);
	return migrated.some((affiliation, index) => affiliation !== affiliations[index])
		? migrated
		: undefined;
}

interface Reference {
	_ref: string;
	_type: 'reference';
}

interface ImageValue<Type extends string> {
	_type: Type;
	alt: string;
	asset: Reference;
}

interface StatsItem {
	[field: string]: unknown;
	_key: string;
	_type: 'stats';
	prefix?: string;
	suffix?: string;
	title?: string;
	value?: number;
}

interface DepartmentDocument {
	_id: string;
	_type: 'department';
	cardImage: ImageValue<'extendedImage'>;
	contactPersons: (Reference & { _key: string })[];
	heroImage: ImageValue<'extendedImage'>;
	icon: string;
	isTeamSport: boolean;
	meta: { _type: 'metaFields'; openGraphImage: ImageValue<'image'> };
	slug: { _type: 'slug'; current: string };
	sortOrder: number;
	stats: StatsItem[];
	title: string;
}

/** A `group.<x>` document as the raw perspective returns it. */
interface LegacyGroupDocument {
	[field: string]: unknown;
	_id: string;
	_rev?: string;
	_type: string;
	_updatedAt?: string;
	isSportGroup?: boolean;
	slug?: { _type?: 'slug'; current?: string };
	title?: string;
}

interface GroupDocument {
	[field: string]: unknown;
	_id: string;
	_type: 'group';
	department: Reference;
}

/** A person affiliation; `department` is a string before the migration and a reference after it. */
interface Affiliation {
	[field: string]: unknown;
	_key: string;
	department?: Reference | string;
	team?: Reference;
}

export { buildDepartmentDocument, migrateAffiliations, toGroupDocument };
export type {
	Affiliation,
	DepartmentDocument,
	GroupDocument,
	LegacyGroupDocument,
	Reference,
	StatsItem,
};
