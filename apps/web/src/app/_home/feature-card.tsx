import { Calendar, CircleHelp, Dumbbell, GraduationCap, House } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
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
		<Card className="transition-colors hover:bg-primary hover:text-primary-foreground">
			<FeatureIcon aria-hidden="true" icon={icon} size={60} strokeWidth={1} />
			<CardHeader>
				<CardTitle className="mt-4 text-xl uppercase md:text-3xl">{title}</CardTitle>
			</CardHeader>

			<CardContent className="mt-2 md:text-xl">{intro}</CardContent>
		</Card>
	);
}
