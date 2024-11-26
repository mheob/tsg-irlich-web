import {
	Calendar,
	CircleHelp,
	Dumbbell,
	GraduationCap,
	House,
	type LucideProps,
} from 'lucide-react';
import Link from 'next/link';
import type { HTMLAttributes } from 'react';

import { ArrowElement } from '@/components/ui/arrow-button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function FeatureIcon({ icon, ...props }: { icon: string } & LucideProps) {
	switch (icon) {
		case 'Dumbbell': {
			return <Dumbbell {...props} />;
		}
		case 'Calendar': {
			return <Calendar {...props} />;
		}
		case 'GraduationCap': {
			return <GraduationCap {...props} />;
		}
		case 'House': {
			return <House {...props} />;
		}
		default: {
			return <CircleHelp {...props} />;
		}
	}
}

interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
	href: string;
	icon: string;
	intro: string;
	title: string;
}

export default function FeatureCard({ href, icon, intro, title }: Readonly<FeatureCardProps>) {
	return (
		<Card className="hover:bg-primary hover:text-primary-foreground flex items-center justify-between gap-4">
			<div>
				<FeatureIcon aria-hidden="true" icon={icon} size={60} strokeWidth={1} />
				<CardHeader>
					<CardTitle className="mt-4 text-3xl uppercase">{title}</CardTitle>
				</CardHeader>

				<CardContent className="mt-2 text-xl group-hover:text-white">{intro}</CardContent>
			</div>

			<Link className="flex w-1/4 justify-end self-stretch" href={href}>
				<CardFooter>
					<ArrowElement size={32} />
				</CardFooter>
			</Link>
		</Card>
	);
}
