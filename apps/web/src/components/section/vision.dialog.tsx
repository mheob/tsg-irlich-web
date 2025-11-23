'use client';

import type { AboutUs } from '@/types/sanity.types';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../ui/dialog';
import { PortableText, type PortableTextValue } from '../ui/portable-text';
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
			<DialogTrigger asChild>
				<Button className="relative mt-12">{ctaLongVision}</Button>
			</DialogTrigger>
			<DialogContent className="max-w-3xl">
				<DialogTitle className="text-lg tracking-normal md:text-2xl">{longVisionTitle}</DialogTitle>
				<ScrollArea className="max-h-[calc(100vh-200px)]">
					<DialogDescription
						className="prose-sm lg:prose mt-10 text-base tracking-normal md:text-lg"
						asChild
					>
						<div>
							<PortableText value={longVision.text as PortableTextValue} />
						</div>
					</DialogDescription>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
