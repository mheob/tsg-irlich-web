import Image from 'next/image';
import type { ComponentProps } from 'react';

import {
	ImageDialog,
	ImageDialogContent,
	ImageDialogTitle,
	ImageDialogTrigger,
} from './image-dialog';

interface ZoomableImageProps extends ComponentProps<typeof Image> {
	srcFull: string;
}

export function ZoomableImage({ alt, src, srcFull, ...props }: Readonly<ZoomableImageProps>) {
	if (!src || !srcFull) return null;

	return (
		<ImageDialog>
			<ImageDialogTrigger className="cursor-zoom-in" asChild>
				<Image alt={alt || ''} src={src} {...props} />
			</ImageDialogTrigger>
			<ImageDialogContent className="max-w-screen border-0 bg-transparent p-0 shadow-none">
				<ImageDialogTitle className="sr-only">{alt || ''}</ImageDialogTitle>
				<div className="relative h-[calc(100vh-250px)] w-full">
					<Image
						alt={alt || ''}
						className="h-full w-full object-contain"
						loading="lazy"
						src={srcFull}
						fill
					/>
				</div>
			</ImageDialogContent>
		</ImageDialog>
	);
}
