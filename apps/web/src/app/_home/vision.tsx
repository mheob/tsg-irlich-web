import Link from 'next/link';

import { Button } from '@/components/ui/button';
import SectionHeader from '@/components/ui/section-header';
import type { Home } from '@/types/sanity.types';

import styles from './vision.module.css';

type VisionProps = Home['content']['visionSection'];

export default function Vision({ cta, intro, subtitle, title }: Readonly<VisionProps>) {
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
					<SectionHeader subTitle={subtitle} title={title}>
						{intro}
					</SectionHeader>

					<Button className="relative mt-12" asChild>
						<Link href="#!">{cta}</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
