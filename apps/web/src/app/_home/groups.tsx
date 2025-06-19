'use client';

import { ArrowButtonGroup } from '@/components/ui/arrow-button';
import { SectionHeader } from '@/components/ui/section-header';
import { groupSections } from '@/constants/groups';
import type { Home } from '@/types/sanity.types';

import { GroupCard } from './group-card';

import styles from './groups.module.css';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

type GroupsProps = Home['content']['groupsSection'];

export function Groups({ subtitle, title }: GroupsProps) {
	return (
		<section className="relative">
			<div className={styles.bg}></div>
			<div className={styles.bgBalls}></div>

			<div className="container mx-auto px-5 py-10 md:py-32">
				<div className="md:flex md:justify-between">
					<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered />
					<ArrowButtonGroup className="hidden md:flex" />
				</div>

				<div className="my-6 flex flex-col gap-2 md:mt-24 md:flex-row md:gap-7 md:overflow-x-scroll">
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

				<ArrowButtonGroup className="md:hidden" />
			</div>
		</section>
	);
}
