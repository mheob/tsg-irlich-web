'use client';

import type { AboutUs } from '@/types/sanity.types';

import { Button } from '../ui/button';
import { Dialog, DialogDescription, DialogPopup, DialogTitle, DialogTrigger } from '../ui/dialog';
import { PortableText } from '../ui/portable-text';
import { ScrollArea } from '../ui/scroll-area';

type LongVisionDialogProps = Pick<
	AboutUs['content']['visionSection'],
	'ctaLongVision' | 'longVision' | 'longVisionTitle'
>;

export function LongVisionDialog({
	ctaLongVision,
	longVision,
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
						{longVision?.text && <PortableText value={longVision.text} />}
					</DialogDescription>
				</ScrollArea>
			</DialogPopup>
		</Dialog>
	);
}
