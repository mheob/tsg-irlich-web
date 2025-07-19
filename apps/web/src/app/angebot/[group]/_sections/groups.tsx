import { SectionHeader } from '@/components/ui/section-header';
import type { GroupsPage, Groups as GroupsType } from '@/types/sanity.types';
import type { GroupSection } from '@/utils/groups';

import GroupCard from './group-card';

import styles from './groups.module.css';

type GroupsProps = GroupsPage['content']['groupsSection'] &
	GroupsType & { currentDepartment?: GroupSection };

export default function Groups({
	currentDepartment,
	groups,
	intro,
	subtitle,
	title,
}: Readonly<GroupsProps>) {
	return (
		<section className={`${styles.bg} bg-background-low-contrast relative z-0`}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader
					subTitle={subtitle}
					title={`${title} ${currentDepartment?.title}`.trim()}
					isCentered
					isCenteredOnDesktop
				>
					{intro}
				</SectionHeader>

				<div className="my-6 grid grid-cols-1 gap-4 md:mt-24 md:grid-cols-2 md:gap-7 xl:grid-cols-3">
					{groups?.map(({ slug, ...rest }) => (
						<GroupCard {...rest} key={slug} slug={slug} />
					))}
				</div>
			</div>
		</section>
	);
}
