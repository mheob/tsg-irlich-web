import { stegaClean } from 'next-sanity';

import { cn } from '@tsgi-web/shared';

import { GroupCard } from '@/components/ui/group-card';
import { SectionHeader } from '@/components/ui/section-header';
import type { DepartmentPageQueryResult, GroupsPage } from '@/types/sanity.types';
import { getInternalHref } from '@/utils/links';

import styles from './groups.module.css';

type DepartmentGroup = NonNullable<DepartmentPageQueryResult>['groups'][number];

type GroupsProps = GroupsPage['content']['groupsSection'] & {
	departmentSlug: string;
	departmentTitle: string;
	// The icon is a plain string here, because `sanityFetch` brands every string as one that may carry
	// stega characters. The card gets it cleaned.
	groups: (Omit<DepartmentGroup, 'icon'> & { icon: string })[];
};

export function Groups({
	departmentSlug,
	departmentTitle,
	groups,
	intro,
	subtitle,
	title,
}: Readonly<GroupsProps>) {
	return (
		<section className={cn(styles.bg, 'relative z-0 bg-background-low-contrast')}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader
					title={
						<>
							{title} <span className="text-primary">{departmentTitle}</span>
						</>
					}
					subTitle={subtitle}
					isCentered
					isCenteredOnDesktop
				>
					{intro}
				</SectionHeader>

				<div className="my-6 grid grid-cols-1 gap-4 md:mt-24 md:grid-cols-2 md:gap-7 xl:grid-cols-3">
					{groups.map(({ featuredImage, icon, slug, ...group }) => {
						const href = getInternalHref({ _type: 'group', department: departmentSlug, slug });

						// A group whose department has no slug has no page to link to
						return href ? (
							<GroupCard
								{...group}
								href={href}
								icon={stegaClean(icon)}
								image={featuredImage}
								key={slug}
							/>
						) : null;
					})}
				</div>
			</div>
		</section>
	);
}
