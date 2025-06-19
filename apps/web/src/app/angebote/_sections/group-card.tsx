import { DOSBIcon, type DosbIconName } from '@tsgi-web/shared';
import Link from 'next/link';

import { ArrowElement } from '@/components/ui/arrow-button';

import styles from './group-card.module.css';

interface GroupCardProps {
	icon: DosbIconName;
	slug: string;
	title: string;
}

export default function GroupCard({ icon, slug, title }: Readonly<GroupCardProps>) {
	return (
		<article className={`${styles.bgImage} ${styles[icon]} relative shadow-lg`}>
			<Link aria-label={`Mehr über "${title}" erfahren`} href={slug}>
				<div className="flex h-full flex-row items-end justify-between p-6">
					<div className="flex flex-col justify-end">
						<div className="bg-secondary text-primary grid size-12 place-content-center rounded-full text-5xl md:size-14">
							<DOSBIcon className="size-8 w-auto text-current md:size-10" icon={icon} />
						</div>

						<h3 className="text-primary-foreground mt-6 line-clamp-1 font-serif text-3xl uppercase">
							{title}
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
