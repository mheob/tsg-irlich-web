import type { HTMLAttributes } from 'react';

import { ArrowButton } from '@/components/ui/arrow-button';

interface GroupCardProps extends HTMLAttributes<HTMLDivElement> {
	digit: number;
	icon: string;
	title: string;
}

export default function GroupCard({ digit, icon, title }: Readonly<GroupCardProps>) {
	const doubleDigit = digit.toString().padStart(2, '0');

	return (
		<article className="group relative h-56 min-w-[25%]">
			<div className="mt-16 flex h-40 flex-col rounded-xl bg-white p-6 shadow-lg group-hover:bg-black/80">
				<div className="bg-primary text-primary-foreground -mt-16 grid h-24 w-24 place-content-center rounded-xl text-5xl group-hover:hidden">
					{icon}
				</div>

				<div className="text-str absolute right-4 top-20 text-7xl text-white group-hover:hidden">
					{doubleDigit}
				</div>

				<div className="flex flex-1 items-center justify-between group-hover:items-end">
					<h3 className="mt-6 font-serif text-3xl uppercase group-hover:mt-0 group-hover:text-white">
						{title}
					</h3>

					<ArrowButton
						className="hidden text-sm group-hover:block"
						direction="up-right"
						size="32"
						variant="ghost"
					/>
				</div>
			</div>
		</article>
	);
}
