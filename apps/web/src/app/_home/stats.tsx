import type { ComponentProps } from 'react';

import Counter from '@/components/ui/counter';

const stats: ComponentProps<typeof Counter>['values'] = [
	{ title: 'Motivierte Trainer', value: 34 },
	{ suffix: '+', title: 'Mitglieder', value: 700 },
	{ suffix: '+', title: 'Jahre Tradition', value: 140 },
	{ suffix: '+', title: 'Trainingsstunden / Woche', value: 800 },
];

export default function Stats() {
	return <Counter values={stats} />;
}
