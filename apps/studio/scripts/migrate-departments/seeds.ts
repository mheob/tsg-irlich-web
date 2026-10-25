import type { DosbIconName } from '@tsgi-web/shared';

/** The legacy group type whose documents are deleted instead of migrated. */
const ADMIN_LEGACY_TYPE = 'group.admin';
/** The legacy affiliation string of the board, which belongs to no department. */
const ADMIN_LEGACY_AFFILIATION = 'admin';

const SORT_ORDER_STEP = 10;
const BREITENSPORT_EMAIL = 'breitensport@tsg-irlich.de';

/**
 * Completes a department with what follows from its slug and its position: the document id, the
 * image files and the sort order.
 *
 * @param definition - The department as today's `groupSections` describe it.
 * @param index - Its position, starting at 0.
 * @returns The seed.
 */
function toSeed(definition: SeedDefinition, index: number): DepartmentSeed {
	return {
		...definition,
		id: `department-${definition.slug}`,
		images: {
			card: `${definition.slug}-card.webp`,
			hero: `${definition.slug}-hero.webp`,
			openGraph: `${definition.slug}-og.webp`,
		},
		sortOrder: (index + 1) * SORT_ORDER_STEP,
	};
}

/** The six departments in today's order, as `apps/web/src/utils/groups.ts` hard-codes them. */
const DEPARTMENT_SEEDS: readonly DepartmentSeed[] = (
	[
		{
			contactEmail: 'fussball@tsg-irlich.de',
			icon: 'Fussball',
			isTeamSport: true,
			legacyAffiliation: 'soccer',
			legacyType: 'group.soccer',
			slug: 'fussball',
			title: 'Fußball',
		},
		{
			contactEmail: BREITENSPORT_EMAIL,
			icon: 'Turnen',
			isTeamSport: false,
			legacyAffiliation: 'children-gymnastics',
			legacyType: 'group.children-gymnastics',
			slug: 'kinderturnen',
			title: 'Kinderturnen',
		},
		{
			contactEmail: BREITENSPORT_EMAIL,
			icon: 'StepAerobic',
			isTeamSport: false,
			legacyAffiliation: 'courses',
			legacyType: 'group.courses',
			slug: 'kurse',
			title: 'Kurse',
		},
		{
			contactEmail: BREITENSPORT_EMAIL,
			icon: 'Taekwondo',
			isTeamSport: false,
			legacyAffiliation: 'taekwondo',
			legacyType: 'group.taekwondo',
			slug: 'taekwondo',
			title: 'Taekwondo',
		},
		{
			contactEmail: BREITENSPORT_EMAIL,
			icon: 'Tanzen',
			isTeamSport: false,
			legacyAffiliation: 'dance',
			legacyType: 'group.dance',
			slug: 'tanzen',
			title: 'Tanzen',
		},
		{
			contactEmail: BREITENSPORT_EMAIL,
			icon: 'Fitness',
			isTeamSport: false,
			legacyAffiliation: 'other-sports',
			legacyType: 'group.other-sports',
			slug: 'weitere-sportarten',
			title: 'Weitere Sportarten',
		},
	] satisfies SeedDefinition[]
).map((definition, index) => toSeed(definition, index));

/** The department of every legacy group type, e.g. `group.soccer` → Fußball. */
const SEED_BY_LEGACY_TYPE: ReadonlyMap<string, DepartmentSeed> = new Map(
	DEPARTMENT_SEEDS.map((seed) => [seed.legacyType, seed]),
);

interface SeedDefinition {
	/** The role email whose holders the department page lists as contact persons today. */
	contactEmail: string;
	icon: DosbIconName;
	isTeamSport: boolean;
	/** The string a person affiliation used for the department, e.g. `soccer`. */
	legacyAffiliation: string;
	/** The document type the department's groups had, e.g. `group.soccer`. */
	legacyType: string;
	slug: string;
	title: string;
}

interface DepartmentSeed extends SeedDefinition {
	/** `department-<slug>`, so every run addresses the same document. */
	id: string;
	/** File names inside `scripts/migrate-departments/images/`. */
	images: DepartmentImages;
	sortOrder: number;
}

interface DepartmentImages {
	card: string;
	hero: string;
	openGraph: string;
}

export { ADMIN_LEGACY_AFFILIATION, ADMIN_LEGACY_TYPE, DEPARTMENT_SEEDS, SEED_BY_LEGACY_TYPE };
export type { DepartmentImages, DepartmentSeed };
