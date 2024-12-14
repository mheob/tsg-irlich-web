'use client';

import ArrowButtonGroup from '@/components/ui/arrow-button-group';
import SectionHeader from '@/components/ui/section-header';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { Home, HomePageGroupsQueryResult } from '@/types/sanity.types';

import GroupCard from './group-card';

import styles from './groups.module.css';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

type GroupsSection = Home['content']['groupsSection'];
type GroupsFields = HomePageGroupsQueryResult;
type GroupsProps = GroupsSection & { groups: GroupsFields };

export default function Groups({ groups, subtitle, title }: GroupsProps) {
	const isDesktop = useMediaQuery('(min-width: 48rem)');

	const randomlyGroups = groups.toSorted(() => Math.random() - 0.5);
	const groupsToShow = isDesktop ? groups : randomlyGroups.slice(0, 3);

	return (
		<section className="relative">
			<div className={styles.bg}></div>
			<div className={styles.bgBalls}></div>

			<div className="container mx-auto px-5 py-10 md:py-32">
				<div className="md:flex md:justify-between">
					<SectionHeader isCentered={!isDesktop} subTitle={subtitle} title={title} />
					{isDesktop && <ArrowButtonGroup />}
				</div>

				<div className="my-6 flex flex-col gap-2 md:mt-24 md:flex-row md:gap-7 md:overflow-x-scroll">
					{groupsToShow?.map(({ icon, title }, index) => (
						<GroupCard
							digit={index + 1}
							icon={icon || getFirstLetter(title)}
							key={title}
							title={title}
						/>
					))}
				</div>

				{!isDesktop && <ArrowButtonGroup />}
			</div>
		</section>
	);
}
