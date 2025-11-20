import { PortableText } from 'next-sanity';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import type { PortableTextValue } from '@/components/ui/portable-text';
import { ScrollArea } from '@/components/ui/scroll-area';
import { urlForImage } from '@/lib/sanity/utils';
import type { ImageCard } from '@/types/sanity.types';

interface ChronicleCardProps {
	category: ImageCard;
}

export function ChronicleCard({
	category: { description, excerpt, image, title },
}: Readonly<ChronicleCardProps>) {
	const imageSource = urlForImage(image, 300, 560);

	return (
		<article className="bg-background group grid rounded-xl shadow-lg">
			<div>
				<div className="relative block h-60 w-full overflow-hidden rounded-t-xl">
					{imageSource && (
						<Image alt={image.alt} sizes="(max-width: 48rem) 100vw, 800px" src={imageSource} fill />
					)}
				</div>

				<div className="px-4 md:px-8">
					<h2 className="pt-4 text-xl md:pt-8 md:text-3xl">{title}</h2>
					<p className="text-muted-foreground pt-4 text-sm md:pt-8 md:text-lg">{excerpt}</p>
				</div>
			</div>

			<div className="place-content-end p-4 md:p-8">
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="link">Mehr erfahren &raquo;</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogTitle className="text-lg tracking-normal md:text-2xl">{title}</DialogTitle>
						<ScrollArea className="max-h-[calc(100vh-200px)]">
							<DialogDescription
								className="prose-sm lg:prose mt-10 text-base tracking-normal md:text-lg"
								asChild
							>
								<div>
									<PortableText value={description.text as PortableTextValue} />
								</div>
							</DialogDescription>
						</ScrollArea>
					</DialogContent>
				</Dialog>
			</div>
		</article>
	);
}
