import Image from 'next/image';

import { cn } from '@tsgi-web/shared';

import { PageIcon } from '@/components/ui/page-icon';
import { SectionHeader } from '@/components/ui/section-header';
import { urlForImage } from '@/lib/sanity/utils';

import type { AreasSection } from '../_shared/types';

const IMAGE_HEIGHT = 900;
const IMAGE_WIDTH = 1200;
const DIGITS = 2;

/**
 * The icon of an area on a blue tile, set on the image or, without one, next to the number.
 *
 * @param props - The icon and where the tile sits.
 * @param props.className - Placement of the tile.
 * @param props.icon - The icon value from the studio.
 * @returns The tile.
 */
function IconTile({ className, icon }: Readonly<{ className?: string; icon: string }>) {
	return (
		<span
			className={cn(
				'grid size-14 place-items-center rounded-2xl bg-primary text-secondary shadow-lg',
				className,
			)}
		>
			<PageIcon aria-hidden="true" className="size-8" icon={icon} strokeWidth={1.5} />
		</span>
	);
}

/**
 * „So kannst du dich einbringen“ from variant B: the areas in rows that alternate between image
 * left and image right, numbered like the offer cards of the home page.
 *
 * @param props - The section.
 * @param props.section - The texts and areas from the studio.
 * @returns The section, or nothing without areas.
 */
function Areas({ section }: Readonly<{ section: AreasSection }>) {
	const { areas, intro, subtitle, title } = section;

	if (!areas?.length) {
		return null;
	}

	return (
		<section className="container py-10 md:py-28">
			<SectionHeader subTitle={subtitle} title={title} isCentered isCenteredOnDesktop>
				{intro}
			</SectionHeader>

			<div className="mt-12 flex flex-col gap-12 md:mt-20 md:gap-20">
				{areas.map((area, index) => {
					const src = urlForImage(area.image, IMAGE_HEIGHT, IMAGE_WIDTH);

					return (
						<article
							className={cn('grid items-center gap-6 md:gap-12 lg:gap-20', src && 'md:grid-cols-2')}
							key={area._key}
						>
							{src && (
								<div
									className={cn(
										'relative aspect-4/3 overflow-hidden rounded-xl bg-primary-light/15 shadow-lg',
										index % 2 === 1 && 'md:order-last',
									)}
								>
									<Image
										alt={area.image.alt}
										className="object-cover"
										sizes="(min-width: 48rem) 50vw, 100vw"
										src={src}
										fill
									/>
									<IconTile className="absolute top-4 left-4" icon={area.icon} />
								</div>
							)}

							<div>
								<div className="flex items-center gap-4">
									<span
										aria-hidden="true"
										className="font-serif text-6xl leading-none text-stroke md:text-8xl"
									>
										{String(index + 1).padStart(DIGITS, '0')}
									</span>
									{!src && <IconTile icon={area.icon} />}
								</div>
								<h3 className="mt-2 font-serif text-3xl uppercase md:text-5xl">{area.title}</h3>
								<p className="mt-4 md:text-xl">{area.text}</p>
								{area.tasks?.length ? (
									<ul
										aria-label={`Beispielaufgaben ${area.title}`}
										className="mt-6 flex flex-wrap gap-2"
									>
										{area.tasks.map((task) => (
											<li
												className="rounded-full bg-primary-light/10 px-3 py-1 text-sm font-semibold text-primary"
												key={task}
											>
												{task}
											</li>
										))}
									</ul>
								) : null}
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
}

export { Areas };
