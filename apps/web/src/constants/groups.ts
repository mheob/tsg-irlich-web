/* cspell:words angebot, kurse */
import type { DosbIconName } from '@tsgi-web/shared/icons/dosb.types';

interface GroupSection {
	icon: DosbIconName;
	slug: string;
	title: string;
}

export const groupSections: GroupSection[] = [
	{
		icon: 'Fussball',
		slug: '/angebot/fussball',
		title: 'Fußball',
	},
	{
		icon: 'Turnen',
		slug: '/angebot/kinderturnen',
		title: 'Kinderturnen',
	},
	{
		icon: 'StepAerobic',
		slug: '/angebot/kurse',
		title: 'Kurse',
	},
	{
		icon: 'Taekwondo',
		slug: '/angebot/taekwondo',
		title: 'Taekwondo',
	},
	{
		icon: 'Tanzen',
		slug: '/angebot/tanzen',
		title: 'Tanzen',
	},
	{
		icon: 'Fitness',
		slug: '/angebot/weitere-sportarten',
		title: 'Weitere Sportarten',
	},
];
