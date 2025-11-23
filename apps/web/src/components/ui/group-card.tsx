import { DOSBIcon } from '@tsgi-web/shared';
import Image from 'next/image';
import Link from 'next/link';

import { ArrowElement } from '@/components/ui/arrow-button';
import { urlForImage } from '@/lib/sanity/utils';
import type { Groups as GroupsType } from '@/types/sanity.types';
import { getGroupImage, type GroupSection } from '@/utils/groups';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

type Group = GroupsType['groups'][number];

interface GroupCardProps {
	currentDepartment?: GroupSection;
	featuredImage?: Group['featuredImage'];
	icon: Group['icon'];
	overviewTitle?: Group['overviewTitle'];
	slug: Group['slug'];
	title: Group['title'];
}

export function GroupCard({
	currentDepartment,
	featuredImage,
	icon,
	overviewTitle,
	slug,
	title,
}: Readonly<GroupCardProps>) {
	return (
		<article className="relative aspect-video shadow-lg transition-transform duration-200 hover:scale-105">
			<div className="absolute inset-0 z-[-1] rounded-xl bg-black/50" />
			<Image
				alt={title}
				className="absolute inset-0 z-[-2] rounded-xl"
				src={urlForImage(featuredImage, 270, 480) ?? getGroupImage(slug).src}
				fill
			/>

			<Link
				aria-label={`Mehr über "${title}" erfahren`}
				href={currentDepartment ? `${currentDepartment.slug}/${slug}` : slug}
			>
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
						className="hover:bg-secondary self-end"
						direction="up-right"
						size="size-6 md:size-8"
						variant="secondary"
					/>
				</div>
			</Link>
		</article>
	);
}
