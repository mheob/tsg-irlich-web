import { at, defineMigration, setIfMissing } from 'sanity/migrate';

import type { DosbIconName } from '@tsgi-web/shared';

import type { ClubIconName } from '@/utils/preview-icon';

/**
 * The first icon of every news category that existed when the field arrived (WEB-427), by slug.
 * A sport takes the pictogram of its group, the rest a club icon. Both datasets share the slugs.
 */
const ICONS_BY_SLUG: Readonly<Record<string, ClubIconName | DosbIconName>> = {
	'after-work-fitness': 'Fitness',
	'alte-herren': 'Fussball',
	badminton: 'Badminton',
	breitensport: 'Laufen',
	diamonds: 'Tanzen',
	faszien: 'Gymnastik',
	frauengymnastik: 'Gymnastik',
	fussball: 'Fussball',
	historie: 'Historie',
	jedermanner: 'SportInGebaeuden',
	jugend: 'Fussball',
	kinderturnen: 'Bodenturnen',
	kurse: 'StepAerobic',
	montagskicker: 'Fussball',
	pilates: 'Pilates',
	'pr-team': 'Presse',
	'rope-skipping': 'RopeSkipping',
	schiedsrichter: 'Trainer',
	senioren: 'Pokal',
	soziales: 'Soziales',
	taekwondo: 'Taekwondo',
	tischtennis: 'Tischtennis',
	turnen: 'Turnen',
	veranstaltungen: 'Veranstaltungen',
	verein: 'Gesamtverein',
	wandern: 'Wandern',
};

/**
 * Looks up the first icon of a news category.
 *
 * @param slug - The slug of the category.
 * @returns The icon name, or `undefined` for a category the list does not know.
 */
function getInitialCategoryIcon(slug: unknown): ClubIconName | DosbIconName | undefined {
	if (typeof slug !== 'string' || !Object.hasOwn(ICONS_BY_SLUG, slug)) {
		return undefined;
	}
	return ICONS_BY_SLUG[slug];
}

export default defineMigration({
	documentTypes: ['news.category'],
	migrate: {
		document({ slug }) {
			const current =
				typeof slug === 'object' && slug !== null && 'current' in slug ? slug.current : undefined;
			const icon = getInitialCategoryIcon(current);

			// `setIfMissing` keeps an icon an editor already chose, which also makes a second run a no-op.
			return icon ? [at('icon', setIfMissing(icon))] : [];
		},
	},
	title: 'News-Kategorien mit einem ersten Icon belegen',
});

export { getInitialCategoryIcon, ICONS_BY_SLUG };
