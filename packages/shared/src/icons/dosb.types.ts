export const DOSB_ICONS = [
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
export type DosbIconName = (typeof DOSB_ICONS)[number];

export const DOSB_ICONS_SET = new Set(DOSB_ICONS);
