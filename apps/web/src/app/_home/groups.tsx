import { SectionHeader } from '@/components/ui/section-header';
import type { Home } from '@/types/sanity.types';
import { groupSections } from '@/utils/groups';

import { GroupCard } from './group-card';

import styles from './groups.module.css';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

type GroupsProps = Home['content']['groupsSection'];

export function Groups({ subtitle, title }: Readonly<GroupsProps>) {
	return (
		<section className="relative">
			<div className={styles.bg}></div>
			<div className={styles.bgBalls}></div>

			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered />

				<div className="my-6 grid grid-cols-1 gap-2 md:mt-24 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
					{groupSections?.map(({ icon, slug, title }, index) => (
						<GroupCard
							digit={index + 1}
							icon={icon || getFirstLetter(title)}
							key={title}
							slug={slug}
							title={title}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
