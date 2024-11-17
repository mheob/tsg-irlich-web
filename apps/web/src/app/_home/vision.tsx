import Link from 'next/link';

import { Button } from '@/components/ui/button';
import SectionHeader from '@/components/ui/section-header';

import styles from './vision.module.css';

export default function Vision() {
	return (
		<section className="relative items-center">
			<div className="container mx-auto grid grid-cols-[55%,45%] px-5">
				<div>
					<div className={styles.bgRoundedEdge}></div>
					<div className="bg-secondary absolute left-[calc(28%-12rem)] top-20 grid h-96 w-96 place-content-center rounded-full">
						IMAGE 1
					</div>
					<div className="bg-secondary absolute left-[calc(13%-8rem)] top-[calc(50%-3rem)] grid h-64 w-64 place-content-center rounded-full">
						IMAGE 2
					</div>
					<div className="bg-secondary absolute bottom-24 left-[calc(29%-8rem)] grid h-64 w-64 place-content-center rounded-full">
						IMAGE 3
					</div>
				</div>

				<div className="py-60">
					<SectionHeader subTitle="Unsere Vision" title="Was sind unsere Ziele? Wofür stehen wir?">
						Die TSG Irlich 1882 e.V. ist ein traditionsreicher Verein mit rund 700 Mitgliedern und
						18 verschiedenen Sportarten. Als einer der größten Vereine im Stadtgebiet bietet die TSG
						sportliche Aktivitäten für jedes Alter und fördert körperliche Fitness sowie soziale
						Interaktion. Der Verein legt großen Wert auf soziale Verantwortung, Fairness und eine
						tolle Gemeinschaft.
					</SectionHeader>

					<Button className="relative mt-12" asChild>
						<Link href="#!">Erfahre mehr über uns</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
