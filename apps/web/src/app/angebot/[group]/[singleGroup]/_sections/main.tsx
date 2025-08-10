import type { PortableTextBlock } from 'next-sanity';

import { PortableText } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import type { GroupDance, SimpleBlockContent } from '@/types/sanity.types';

import styles from './main.module.css';

interface MainProps {
	description: SimpleBlockContent | string;
	gallery: GroupDance['images'];
	title: string;
}

export function Main({ description, gallery, title }: Readonly<MainProps>) {
	const imagesCount = gallery?.length ?? 0;

	return (
		<section className={`${styles.bg} bg-background-low-contrast relative z-0`}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader
					className={`${styles.description} mb-10`}
					title={title}
					isCentered
					isCenteredOnDesktop
				>
					{typeof description === 'string' ? (
						description
					) : (
						<PortableText value={description.text as PortableTextBlock[]} />
					)}
				</SectionHeader>

				{imagesCount === 1 && <div className="aspect-video rounded-xl bg-gray-600" />}

				{imagesCount === 2 && (
					<div className="my-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10">
						{/* TODO: add images (gallery[0], gallery[1] and gallery[2]) */}
						<div className="aspect-video rounded-xl bg-yellow-200" />
						<div className="aspect-video rounded-xl bg-purple-200" />
					</div>
				)}

				{imagesCount === 3 && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-10">
						<div className="col-span-2 row-span-2 aspect-video rounded-xl bg-red-200" />
						<div className="size-full rounded-xl bg-blue-200" />
						<div className="size-full rounded-xl bg-green-200" />
					</div>
				)}
			</div>
		</section>
	);
}
