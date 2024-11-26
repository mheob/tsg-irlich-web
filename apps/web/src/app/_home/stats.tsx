import Counter from '@/components/ui/counter';
import type { Home } from '@/types/sanity.types';

type StatsProps = Home['content']['statsSection'];

export default function Stats({ stats }: Readonly<StatsProps>) {
	return <Counter values={stats} />;
}
