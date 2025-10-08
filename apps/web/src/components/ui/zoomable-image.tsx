import Image from 'next/image';
import type { ComponentProps } from 'react';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../with-logic/dialog';

interface ZoomableImageProps extends ComponentProps<typeof Image> {
	srcFull: string;
}

export function ZoomableImage({ alt, src, srcFull, ...props }: Readonly<ZoomableImageProps>) {
	if (!src || !srcFull) return null;

	return (
		<Dialog>
			<DialogTrigger className="cursor-zoom-in" asChild>
				<Image alt={alt || ''} src={src} {...props} />
			</DialogTrigger>
			<DialogContent className="max-w-screen border-0 bg-transparent p-0 shadow-none">
				<DialogTitle className="sr-only">{alt || ''}</DialogTitle>
				<div className="relative h-[calc(100vh-250px)] w-full">
					<Image
						alt={alt || ''}
						className="h-full w-full object-contain"
						loading="lazy"
						src={srcFull}
						fill
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
