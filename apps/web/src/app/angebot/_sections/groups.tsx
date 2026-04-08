import { cn } from '@tsgi-web/shared';

import { GroupCard } from '@/components/ui/group-card';
import { SectionHeader } from '@/components/ui/section-header';
import type { DepartmentsPage } from '@/types/sanity.types';
import { groupSections } from '@/utils/groups';

import styles from './groups.module.css';

type GroupsProps = DepartmentsPage['content']['departmentsSection'];

export function Groups({ intro, subtitle, title }: Readonly<GroupsProps>) {
	return (
		<section className={cn(styles.bg, 'relative z-0 bg-background-low-contrast')}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader subTitle={subtitle} title={title} isCentered isCenteredOnDesktop>
					{intro}
				</SectionHeader>

				<div className="my-6 grid grid-cols-1 gap-4 md:mt-24 md:grid-cols-2 md:gap-7 xl:grid-cols-3">
					{groupSections?.map(({ icon, slug, title: groupSectionTitle }) => (
						<GroupCard icon={icon} key={slug} slug={slug} title={groupSectionTitle} />
					))}
				</div>
			</div>
		</section>
	);
}
