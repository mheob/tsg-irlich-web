import { DOSBIcon } from '@tsgi-web/shared';
import Link from 'next/link';

import { ArrowElement } from '@/components/ui/arrow-button';
import type { Groups as GroupsType } from '@/types/sanity.types';

import styles from './group-card.module.css';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

type GroupCardProps = GroupsType['groups'][number];

export default function GroupCard({ icon, overviewTitle, slug, title }: Readonly<GroupCardProps>) {
	return (
		<article className={`${styles.bgImage} ${styles[icon]} relative shadow-lg`}>
			<Link aria-label={`Mehr über "${title}" erfahren`} href={slug}>
				<div className="flex h-full flex-row items-end justify-between p-6">
					<div className="flex flex-col justify-end">
						<div className="bg-secondary text-primary grid size-12 place-content-center rounded-full text-5xl md:size-14">
							<DOSBIcon
								className="size-8 w-auto text-current md:size-10"
								icon={icon ?? getFirstLetter(title)}
							/>
						</div>

						<h3 className="text-primary-foreground mt-6 line-clamp-1 font-serif text-3xl uppercase">
							{overviewTitle ?? title}
						</h3>
					</div>

					<ArrowElement
						aria-hidden="true"
						className="self-end"
						direction="up-right"
						size="size-6 md:size-8"
						variant="secondary"
					/>
				</div>
			</Link>
		</article>
	);
}
