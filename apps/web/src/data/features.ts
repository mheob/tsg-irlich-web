import { Calendar, Dumbbell, GraduationCap, House, type LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

// TODO: get complete feature section from sanity

export const features: {
	href: string;
	icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
	intro: string;
	title: string;
}[] = [
	{
		href: '#!',
		icon: Dumbbell,
		intro: 'Die TSG bietet mit vielfältigem Sportangebot jedem Sportler eine Heimat.',
		title: 'Sportliche Vielfalt',
	},
	{
		href: '#!',
		icon: Calendar,
		intro: 'Bei uns trainieren alle Altersgruppen. Vom Kleinkind- bis zum Senioren-Sport.',
		title: 'Jung und Alt',
	},
	{
		href: '#!',
		icon: GraduationCap,
		intro:
			'Wir fördern und investieren in die Ausbildung unsere ehrenamtlichen Übungsleiterinnen und Übungsleiter.',
		title: 'Engagiert und kompetent',
	},
	{
		href: '#!',
		icon: House,
		intro: 'Wir engagieren uns im vielfältigen Dorfleben von unserer Heimat - Irlich am Rhein.',
		title: 'Irlich - Unsere Heimat',
	},
];
