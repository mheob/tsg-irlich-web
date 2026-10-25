import { SectionHeader } from '@/components/ui/section-header';
import type { DepartmentCardsQueryResult, Home } from '@/types/sanity.types';
import { getInternalHref } from '@/utils/links';

import { GroupCard } from './group-card';

import styles from './groups.module.css';

type GroupsProps = Home['content']['groupsSection'] & { departments: DepartmentCardsQueryResult };

export function Groups({ departments, subtitle, title }: Readonly<GroupsProps>) {
	// A department without a slug has no page to link to. Dropping it before the cards are numbered
	// keeps the digits free of gaps.
	const linkedDepartments = departments.flatMap(({ _id, icon, slug, title: departmentTitle }) => {
		const href = getInternalHref({ _type: 'department', slug });

		return href ? [{ _id, href, icon, title: departmentTitle }] : [];
	});

	return (
		<section className="relative">
			<div className={styles.bg} />
			<div className={styles.bgBalls} />

			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered />

				<div className="my-6 grid grid-cols-1 gap-2 md:mt-24 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
					{linkedDepartments.map(({ _id, href, icon, title: departmentTitle }, index) => (
						<GroupCard
							digit={index + 1}
							icon={icon}
							key={_id}
							slug={href}
							title={departmentTitle}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
