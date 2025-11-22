import {
	Calendar,
	CircleHelp,
	Dumbbell,
	GraduationCap,
	House,
	type LucideProps,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
	icon: string;
	intro: string;
	title: string;
}

export function FeatureCard({ icon, intro, title }: Readonly<FeatureCardProps>) {
	return (
		<Card className="hover:bg-primary hover:text-primary-foreground transition-colors">
			<FeatureIcon aria-hidden="true" icon={icon} size={60} strokeWidth={1} />
			<CardHeader>
				<CardTitle className="mt-4 text-xl uppercase md:text-3xl">{title}</CardTitle>
			</CardHeader>

			<CardContent className="mt-2 md:text-xl">{intro}</CardContent>
		</Card>
	);
}
