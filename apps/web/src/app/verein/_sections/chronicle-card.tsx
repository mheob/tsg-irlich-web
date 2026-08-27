import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogPopup,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { PortableText } from '@/components/ui/portable-text';
import { ScrollArea } from '@/components/ui/scroll-area';
import { urlForImage } from '@/lib/sanity/utils';
import type { ImageCard } from '@/types/sanity.types';

const IMAGE_SIZE = { height: 300, width: 560 };

interface ChronicleCardProps {
	category: ImageCard;
}

export function ChronicleCard({
	category: { description, excerpt, image, title },
}: Readonly<ChronicleCardProps>) {
	const imageSource = urlForImage(image, IMAGE_SIZE.height, IMAGE_SIZE.width);

	return (
		<article className="group grid rounded-xl bg-background shadow-lg">
			<div>
				<div className="relative block h-60 w-full overflow-hidden rounded-t-xl">
					{imageSource && (
						<Image
							alt={image.alt}
							className="object-cover"
							sizes="(max-width: 48rem) 100vw, 800px"
							src={imageSource}
							fill
						/>
					)}
				</div>

				<div className="px-4 md:px-8">
					<h2 className="pt-4 text-xl md:pt-8 md:text-3xl">{title}</h2>
					<p className="pt-4 text-sm text-muted-foreground md:pt-8 md:text-lg">{excerpt}</p>
				</div>
			</div>

			<div className="place-content-end p-4 md:p-8">
				<Dialog>
					<DialogTrigger render={<Button variant="link" />}>Mehr erfahren &raquo;</DialogTrigger>
					<DialogPopup className="max-w-2xl">
						<DialogTitle className="text-lg tracking-normal md:text-2xl">{title}</DialogTitle>
						<ScrollArea className="max-h-[calc(100vh-200px)]">
							<DialogDescription
								className="prose-sm mt-10 text-base tracking-normal md:text-lg lg:prose"
								render={<div />}
							>
								{/* oxlint-disable-next-line react/jsx-max-depth*/}
								<PortableText value={description.text} />
							</DialogDescription>
						</ScrollArea>
					</DialogPopup>
				</Dialog>
			</div>
		</article>
	);
}
