import { SectionHeader } from '@/components/ui/section-header';
import type { GroupsPage, GroupsQueryResult } from '@/types/sanity.types';

import GroupCard from './group-card';

import styles from './groups.module.css';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

type GroupsSection = GroupsPage['content']['groupsSection'];
type GroupsFields = GroupsQueryResult;
type GroupsProps = GroupsSection & { groups: GroupsFields };

export default function Groups({ groups, subtitle, title }: GroupsProps) {
	return (
		<section className={`${styles.bg} bg-background-low-contrast relative`}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader subTitle={subtitle} title={title} isCentered isCenteredOnDesktop />

				<div className="my-6 grid grid-cols-1 gap-2 sm:grid-cols-2 md:mt-24 md:grid-cols-3 md:gap-7 lg:grid-cols-4">
					{groups?.map(({ _id, icon, title }) => (
						<GroupCard icon={icon || getFirstLetter(title)} key={_id} title={title} />
					))}
				</div>
			</div>
		</section>
	);
}
