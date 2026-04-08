import { ArrowUpRight } from 'lucide-react';
import type { LinkProps } from 'next/link';
import Link from 'next/link';

import { DOSBIcon } from '@tsgi-web/shared';
import type { DosbIconName } from '@tsgi-web/shared';

interface GroupCardProps {
	digit: number;
	icon: DosbIconName;
	slug: LinkProps['href'];
	title: string;
}

export function GroupCard({ digit, icon, slug, title }: Readonly<GroupCardProps>) {
	// oxlint-disable-next-line no-magic-numbers
	const doubleDigit = digit.toString().padStart(2, '0');

	return (
		<article className="group relative h-56 min-w-[25%]">
			<Link
				className="mt-16 flex h-40 flex-col rounded-xl bg-background p-6 shadow-lg transition-colors group-hover:bg-primary"
				href={slug}
			>
				<div className="-mt-16 grid size-20 place-content-center rounded-xl border-2 border-background bg-primary text-5xl text-primary-foreground md:size-24">
					<DOSBIcon className="h-12 w-auto text-current md:h-16" icon={icon} />
				</div>

				<div className="absolute inset-e-4 top-20 text-5xl text-stroke text-white opacity-100 transition-all group-hover:opacity-0 md:text-7xl">
					{doubleDigit}
				</div>

				<div className="relative flex flex-1">
					<h3 className="mt-6 self-end font-serif text-3xl uppercase transition-colors group-hover:text-white">
						{title}
					</h3>

					<ArrowUpRight
						className="absolute inset-e-0 bottom-0 text-white opacity-0 group-hover:opacity-100"
						size={32}
					/>
				</div>
			</Link>
		</article>
	);
}
