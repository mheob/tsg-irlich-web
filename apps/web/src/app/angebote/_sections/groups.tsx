/* cspell:words angebot, kurse */
import type { DosbIconName } from '@tsgi-web/shared';
import type { StaticImageData } from 'next/image';

import { SectionHeader } from '@/components/ui/section-header';
import type { GroupsPage } from '@/types/sanity.types';

import GroupCard from './group-card';

import styles from './groups.module.css';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

interface Group {
	icon: DosbIconName;
	image?: StaticImageData;
	slug: string;
	title: string;
}

const groups: Group[] = [
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

type GroupsProps = GroupsPage['content']['groupsSection'];

// export default function Groups({ groups, subtitle, title }: GroupsProps) {
export default function Groups({ intro, subtitle, title }: GroupsProps) {
	return (
		<section className={`${styles.bg} bg-background-low-contrast relative z-0`}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader subTitle={subtitle} title={title} isCentered isCenteredOnDesktop>
					{intro}
				</SectionHeader>

				<div className="my-6 grid grid-cols-1 gap-4 md:mt-24 md:grid-cols-2 md:gap-7 xl:grid-cols-3">
					{groups?.map(({ icon, slug, title }) => (
						<GroupCard icon={icon || getFirstLetter(title)} key={slug} slug={slug} title={title} />
					))}
				</div>
			</div>
		</section>
	);
}
