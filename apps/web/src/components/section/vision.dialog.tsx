'use client';

import type { ReactNode } from 'react';

import type { AboutUs } from '@/types/sanity.types';

import { Button } from '../ui/button';
import { Dialog, DialogDescription, DialogPopup, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

type LongVisionDialogProps = Pick<
	AboutUs['content']['visionSection'],
	'ctaLongVision' | 'longVisionTitle'
> & {
	/**
	 * The long vision, rendered on the server by `Vision`. Rendering the portable text here would
	 * ship `@portabletext/react` and the Sanity client with it to the browser (WEB-412).
	 */
	children?: ReactNode;
};

export function LongVisionDialog({
	children,
	ctaLongVision,
	longVisionTitle,
}: Readonly<LongVisionDialogProps>) {
	return (
		<Dialog>
			<DialogTrigger render={<Button className="relative mt-12" />}>{ctaLongVision}</DialogTrigger>
			<DialogPopup className="max-w-3xl">
				<DialogTitle className="text-lg tracking-normal md:text-2xl">{longVisionTitle}</DialogTitle>
				<ScrollArea className="max-h-[calc(100vh-200px)]">
					<DialogDescription
						className="prose-sm mt-10 text-base tracking-normal md:text-lg lg:prose"
						render={<div />}
					>
						{children}
					</DialogDescription>
				</ScrollArea>
			</DialogPopup>
		</Dialog>
	);
}
