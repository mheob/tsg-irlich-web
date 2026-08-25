import { cn } from '@tsgi-web/shared';

import { Gallery } from '@/components/ui/gallery';
import { PortableText } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import type { GroupDance, SimpleBlockContent } from '@/types/sanity.types';
import { getGalleryImages } from '@/utils/image';

import styles from './main.module.css';

const IMAGE_SIZE = { height: 700, width: 1244 };

function Main({ description, gallery, title }: Readonly<MainProps>) {
	const images = getGalleryImages(gallery, IMAGE_SIZE.height, IMAGE_SIZE.width);

	return (
		<section className={cn(styles.bg, 'relative z-0')}>
			<div className="container py-10 md:py-32">
				<SectionHeader
					className="mb-10 [&>p]:mt-6"
					level="h1"
					title={title}
					isCentered
					isCenteredOnDesktop
				>
					<PortableText value={description.text} />
				</SectionHeader>

				<Gallery images={images} />
			</div>
		</section>
	);
}

interface MainProps {
	description: SimpleBlockContent;
	gallery: GroupDance['images'];
	title: string;
}

export { Main };
