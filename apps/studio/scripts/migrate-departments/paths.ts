import type { LegacyGroupDocument } from './build';
import { departmentIdOf, isPublished, toNewGroupId } from './documents';
import { DEPARTMENT_SEEDS, SEED_BY_LEGACY_TYPE } from './seeds';
import type { DepartmentSummary, GroupSummary } from './store';

const OFFER_PATH = '/angebot';

/**
 * The published departments once the run is through: the existing ones and the ones it creates.
 *
 * @param departments - Every department before the run.
 * @param problems - Where a department without slug is reported.
 * @returns The departments by sort order.
 */
function departmentsAfter(
	departments: readonly DepartmentSummary[],
	problems: string[],
): PathDepartment[] {
	const existing = departments.filter(({ _id }) => isPublished(_id));
	const existingIds = new Set(existing.map(({ _id }) => _id));
	const created = DEPARTMENT_SEEDS.filter(({ id }) => !existingIds.has(id));
	const after: PathDepartment[] = created.map(({ id, slug, sortOrder }) => ({
		id,
		slug,
		sortOrder,
	}));
	for (const department of existing) {
		if (department.slug) {
			after.push({
				id: department._id,
				slug: department.slug,
				sortOrder: department.sortOrder ?? Number.MAX_SAFE_INTEGER,
			});
		} else {
			problems.push(`Abteilung ${department._id} hat keinen Slug und bekommt keinen Pfad.`);
		}
	}
	return after.toSorted(
		(first, second) => first.sortOrder - second.sortOrder || first.slug.localeCompare(second.slug),
	);
}

/**
 * The published groups once the run is through: the legacy groups under their new ids and the
 * existing `group` documents with a department. A group a former run already moved is listed
 * once, as it is now.
 *
 * @param sources - The groups before the run, without the ones the run deletes.
 * @returns The groups.
 */
function groupsAfter(sources: PathSources): PathGroup[] {
	const moved = sources.legacyGroups
		.filter(({ _id, _type }) => isPublished(_id) && SEED_BY_LEGACY_TYPE.has(_type))
		.map((group) => ({
			_id: toNewGroupId(group._id),
			departmentId: SEED_BY_LEGACY_TYPE.get(group._type)?.id,
			slug: group.slug?.current,
			title: group.title,
		}));
	const existing = sources.groups
		.filter((group) => isPublished(group._id) && departmentIdOf(group))
		.map((group) => ({
			_id: group._id,
			departmentId: departmentIdOf(group),
			slug: group.slug,
			title: group.title,
		}));
	return [...new Map([...moved, ...existing].map((group) => [group._id, group])).values()];
}

/**
 * The paths of the group pages of one department, by slug.
 *
 * @param department - The department.
 * @param groups - Every published group after the run.
 * @param problems - Where a group without slug is reported.
 * @returns The paths.
 */
function groupPathsOf(
	department: PathDepartment,
	groups: readonly PathGroup[],
	problems: string[],
): string[] {
	const slugs: string[] = [];
	for (const group of groups.filter(({ departmentId }) => departmentId === department.id)) {
		if (group.slug) {
			slugs.push(group.slug);
		} else {
			problems.push(
				`Gruppe ${group._id} („${group.title ?? ''}“) hat keinen Slug und bekommt keinen Pfad.`,
			);
		}
	}
	return slugs
		.toSorted((first, second) => first.localeCompare(second))
		.map((slug) => `${OFFER_PATH}/${department.slug}/${slug}`);
}

/**
 * Every page the website serves for a department or a group after the run, which is every page it
 * served before.
 *
 * @param sources - The departments and groups before the run, without the groups the run deletes.
 * @param problems - Where a document without path is reported.
 * @returns `/angebot/<department>` and `/angebot/<department>/<group>`, department by department.
 */
function collectPaths(sources: PathSources, problems: string[]): string[] {
	const departments = departmentsAfter(sources.departments, problems);
	const groups = groupsAfter(sources);
	const departmentIds = new Set(departments.map(({ id }) => id));
	for (const group of groups.filter(({ departmentId }) => !departmentIds.has(departmentId ?? ''))) {
		problems.push(
			`Gruppe ${group._id} verweist auf die Abteilung ${group.departmentId ?? ''}, die es nicht gibt.`,
		);
	}
	const paths: string[] = [];
	for (const department of departments) {
		paths.push(`${OFFER_PATH}/${department.slug}`, ...groupPathsOf(department, groups, problems));
	}
	return paths;
}

interface PathSources {
	departments: readonly DepartmentSummary[];
	groups: readonly GroupSummary[];
	legacyGroups: readonly LegacyGroupDocument[];
}

interface PathDepartment {
	id: string;
	slug: string;
	sortOrder: number;
}

interface PathGroup {
	_id: string;
	departmentId?: string;
	slug?: string | null;
	title?: string | null;
}

export { collectPaths };
