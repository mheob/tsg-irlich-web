import ArrowButtonGroup from '@/components/ui/arrow-button-group';
import SectionHeader from '@/components/ui/section-header';

import GroupCard from './group-card';

import styles from './groups.module.css';

const groups: {
	icon: string;
	// image: Image;
	title: string;
}[] = [
	{
		icon: '',
		title: '1. Mannschaft',
	},
	{
		icon: '',
		title: '2. Mannschaft',
	},
	{
		icon: '',
		title: 'Eltern-Kind Turnen',
	},
	{
		icon: '',
		title: 'D-Jugend ',
	},
	{
		icon: '',
		title: 'Kinderturnen 3-6 Jahre',
	},
];

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

export default function Groups() {
	return (
		<section className="relative">
			<div className={styles.bg}></div>
			<div className={styles.bgBalls}></div>

			<div className="container mx-auto px-5 py-32">
				<div className="flex items-end justify-between">
					<SectionHeader subTitle="Gruppen die wir haben" title="Unsere Angebote" />
					<ArrowButtonGroup />
				</div>

				<div className="mt-24 flex gap-7 overflow-x-scroll pb-4">
					{/* // TODO: sort randomly */}
					{groups?.map(({ icon, title }, index) => (
						<GroupCard
							digit={index + 1}
							icon={icon || getFirstLetter(title)}
							key={title}
							title={title}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
