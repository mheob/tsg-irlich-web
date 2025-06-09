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

function FeatureIcon({ icon, ...props }: LucideProps & { icon: string }) {
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

export function FeatureCard({ href, icon, intro, title }: Readonly<FeatureCardProps>) {
	return (
		<Card className="hover:bg-primary hover:text-primary-foreground flex items-center justify-between gap-4">
			<div>
				<FeatureIcon aria-hidden="true" icon={icon} size={60} strokeWidth={1} />
				<CardHeader>
					<CardTitle className="mt-4 text-xl uppercase md:text-3xl">{title}</CardTitle>
				</CardHeader>

				<CardContent className="mt-2 group-hover:text-white md:text-xl">{intro}</CardContent>
			</div>

			<Link
				aria-label={`Mehr über "${title}" erfahren`}
				className="flex w-1/4 justify-end self-stretch"
				href={href}
			>
				<CardFooter>
					<ArrowElement aria-hidden="true" size="size-6 md:size-8" />
				</CardFooter>
			</Link>
		</Card>
	);
}
