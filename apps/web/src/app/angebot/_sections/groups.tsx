import { SectionHeader } from '@/components/ui/section-header';
import type { DepartmentsPage } from '@/types/sanity.types';
import { groupSections } from '@/utils/groups';

import GroupCard from './group-card';

import styles from './groups.module.css';

type GroupsProps = DepartmentsPage['content']['departmentsSection'];

export default function Groups({ intro, subtitle, title }: Readonly<GroupsProps>) {
	return (
		<section className={`${styles.bg} bg-background-low-contrast relative z-0`}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader subTitle={subtitle} title={title} isCentered isCenteredOnDesktop>
					{intro}
				</SectionHeader>

				<div className="my-6 grid grid-cols-1 gap-4 md:mt-24 md:grid-cols-2 md:gap-7 xl:grid-cols-3">
					{groupSections?.map(({ icon, slug, title }) => (
						<GroupCard icon={icon} key={slug} slug={slug} title={title} />
					))}
				</div>
			</div>
		</section>
	);
}
