import { CalendarDays, ChevronDown, Hourglass, MapPin } from 'lucide-react';
import Image from 'next/image';
import type { ReactElement, ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PortableText } from '@/components/ui/portable-text';
import { formatEventDate } from '@/lib/forms/format';
import type { FormPageQueryResult } from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';

type Form = NonNullable<FormPageQueryResult>;

function Chip({ children, icon }: Readonly<{ children: ReactNode; icon: ReactElement }>) {
	return (
		<li className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-sm">
			<span aria-hidden="true" className="*:size-4">
				{icon}
			</span>
			{children}
		</li>
	);
}

/**
 * The column next to the form: what the event is, when and where, how long one can register and,
 * if the form counts its places, how many are left.
 *
 * Below the large breakpoint only the facts show, and the image and the introduction sit behind a
 * trigger so the form stays within reach. From there on they are always visible. Both are rendered
 * twice for that: a closed `Collapsible.Panel` carries `hidden`, which Tailwind's preflight pins to
 * `display: none !important` in a layer no utility can win against, so no class could open it on a
 * wide screen. The copy that is not wanted is `display: none`, which keeps its image from loading
 * and hides its text from assistive technology.
 *
 * The title is repeated from the large breakpoint on only: the hero shows it on a phone, and as the
 * `h1` of the page. Here it heads the column, so it is an `h2`. The image repeats the hero's as
 * well, so it carries an empty `alt` and screen readers do not hear its description twice.
 *
 * @param props - The column's props.
 * @param props.eventDate - When the event takes place, an ISO date time.
 * @param props.heroImage - The image of the form, shown again next to the form.
 * @param props.intro - The introduction of the form.
 * @param props.location - Where the event takes place.
 * @param props.notice - The line about the remaining places or the waitlist.
 * @param props.registrationEnd - When the registration ends, an ISO date time.
 * @param props.title - The title of the form.
 * @returns The column.
 */
function RegistrationInfo({
	eventDate,
	heroImage,
	intro,
	location,
	notice,
	registrationEnd,
	title,
}: Readonly<RegistrationInfoProps>): ReactElement {
	const image = getPageHeroImage(heroImage, title);
	const media = image && (
		<div className="relative aspect-video overflow-hidden rounded-lg">
			{/* The hero above shows the same image with its description, so this copy is decorative */}
			<Image
				alt=""
				className="object-cover"
				sizes="(min-width: 1024px) 40vw, 100vw"
				src={image.src}
				style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
				fill
			/>
		</div>
	);
	const text = intro?.text?.length ? (
		<div className="space-y-3 text-primary-foreground/90 [&_a]:underline">
			<PortableText value={intro.text} />
		</div>
	) : null;
	const hasDetails = Boolean(media ?? text);

	return (
		<section
			aria-label="Informationen zur Veranstaltung"
			className="bg-primary px-4 py-8 text-primary-foreground sm:px-6 lg:px-10 lg:py-16"
		>
			<div className="mx-auto flex max-w-xl flex-col gap-5 lg:mr-0 lg:max-w-none">
				{media && <div className="hidden lg:block">{media}</div>}

				<h2 className="hidden font-sans-serif text-3xl font-bold text-secondary uppercase lg:block">
					{title}
				</h2>

				<ul className="flex flex-wrap gap-2">
					{eventDate && <Chip icon={<CalendarDays />}>{formatEventDate(eventDate)}</Chip>}
					{location && <Chip icon={<MapPin />}>{location}</Chip>}
					{registrationEnd && (
						<Chip icon={<Hourglass />}>{`bis ${formatEventDate(registrationEnd)}`}</Chip>
					)}
				</ul>

				{notice && (
					<p className="border-l-4 border-secondary-dark bg-secondary-light px-4 py-3 font-semibold text-secondary-foreground">
						{notice}
					</p>
				)}

				{hasDetails && (
					<Collapsible className="lg:hidden">
						<CollapsibleTrigger className="group flex cursor-pointer items-center gap-2 font-bold text-secondary">
							Mehr zur Veranstaltung
							<ChevronDown
								aria-hidden="true"
								className="size-4 transition-transform group-data-panel-open:rotate-180"
							/>
						</CollapsibleTrigger>
						<CollapsibleContent className="space-y-4 pt-4" keepMounted>
							{media}
							{text}
						</CollapsibleContent>
					</Collapsible>
				)}

				{text && <div className="hidden lg:block">{text}</div>}
			</div>
		</section>
	);
}

interface RegistrationInfoProps {
	eventDate?: null | string;
	heroImage?: Form['heroImage'];
	intro?: Form['intro'];
	location?: null | string;
	notice?: null | string;
	registrationEnd?: null | string;
	title: string;
}

export { RegistrationInfo };
