import { DOSBIcon, type DosbIconName } from '@tsgi-web/shared';

import { ArrowLink } from '@/components/ui/arrow-button';

interface GroupCardProps {
	icon: DosbIconName;
	title: string;
}

export default function GroupCard({ icon, title }: Readonly<GroupCardProps>) {
	return (
		<article className="relative">
			<div className="flex flex-col items-center justify-between rounded-xl bg-white p-6 shadow-lg">
				<div className="bg-primary text-primary-foreground grid size-14 place-content-center rounded-full text-5xl md:size-16">
					<DOSBIcon className="h-10 w-auto text-current md:h-12" icon={icon} />
				</div>

				<h3 className="my-6 line-clamp-1 text-center font-serif text-4xl uppercase">{title}</h3>

				<ArrowLink className="text-sm" direction="up-right" href={'#!'} size="32" variant="ghost" />
			</div>
		</article>
	);
}
