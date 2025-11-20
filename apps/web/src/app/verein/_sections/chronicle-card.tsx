import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { urlForImage } from '@/lib/sanity/utils';
import type { ImageCard } from '@/types/sanity.types';

interface ChronicleCardProps {
	category: ImageCard;
}

export function ChronicleCard({
	category: { excerpt, image, title },
}: Readonly<ChronicleCardProps>) {
	const imageSource = urlForImage(image, 450, 800);

	return (
		<article className="bg-background group grid rounded-xl shadow-lg">
			<div>
				{imageSource && (
					<Button
						className="relative block h-60 w-full overflow-hidden rounded-t-xl"
						variant="unstyled"
					>
						<Image
							alt={image.alt}
							className="transform-cpu object-cover duration-500 group-hover:scale-110"
							sizes="(max-width: 48rem) 100vw, 800px"
							src={imageSource}
							fill
						/>
					</Button>
				)}

				<div className="px-4 md:px-8">
					<h2 className="pt-4 text-xl md:pt-8 md:text-3xl">{title}</h2>
					<p className="text-muted-foreground pt-4 text-sm md:pt-8 md:text-lg">{excerpt}</p>
				</div>
			</div>

			<div className="place-content-end p-4 md:p-8">
				<Button variant="link">Mehr erfahren &raquo;</Button>
			</div>
		</article>
	);
}
