const DOSB_ICONS = [
	'Badminton',
	'Bodenturnen',
	'Cheerleading',
	'Fitness',
	'Fussball',
	'Gymnastik',
	'Jujutsu',
	'Pilates',
	'RopeSkipping',
	'SportInGebaeuden',
	'Sportakrobatik',
	'StepAerobic',
	'Taekwondo',
	'Tanzen',
	'Turnen',
	'Wandern',
	'Yoga',
] as const;
type DosbIconName = (typeof DOSB_ICONS)[number];

const DOSB_ICONS_SET: ReadonlySet<string> = new Set<string>(DOSB_ICONS);

/**
 * Checks whether an arbitrary string is the name of a known DOSB icon.
 *
 * @param icon - The icon name to check
 * @returns `true` if a DOSB icon exists for the given name
 */
function isDosbIconName(icon: string): icon is DosbIconName {
	return DOSB_ICONS_SET.has(icon);
}

export { DOSB_ICONS, type DosbIconName, DOSB_ICONS_SET, isDosbIconName };
