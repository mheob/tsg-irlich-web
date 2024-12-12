import ArrowButtonGroup from '@/components/ui/arrow-button-group';
import SectionHeader from '@/components/ui/section-header';
import type { Home, HomePageGroupsQueryResult } from '@/types/sanity.types';

import GroupCard from './group-card';

import styles from './groups.module.css';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

type GroupsSection = Home['content']['groupsSection'];
type GroupsFields = HomePageGroupsQueryResult;
type GroupsProps = GroupsSection & { groups: GroupsFields };

export default function Groups({ groups, subtitle, title }: GroupsProps) {
	return (
		<section className="relative">
			<div className={styles.bg}></div>
			<div className={styles.bgBalls}></div>

			<div className="container mx-auto px-5 py-32">
				<div className="flex items-end justify-between">
					<SectionHeader subTitle={subtitle} title={title} />
					<ArrowButtonGroup />
				</div>

				<div className="mt-24 flex gap-7 overflow-x-scroll pb-4">
					{/* // TODO: sort randomly */}
					{groups?.map(({ icon, title }, index) => (
						<GroupCard
							digit={index + 1}
							icon={icon || getFirstLetter(title)}
							key={title}
							title={title}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
