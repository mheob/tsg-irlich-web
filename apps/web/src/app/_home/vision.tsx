import Link from 'next/link';

import { Button } from '@/components/ui/button';
import SectionHeader from '@/components/ui/section-header';
import type { Home } from '@/types/sanity.types';

import styles from './vision.module.css';

type VisionProps = Home['content']['visionSection'];

export default function Vision({ cta, intro, subtitle, title }: Readonly<VisionProps>) {
	return (
		<section className="relative items-center">
			<div className="md:not-last-of-type:mx-auto md:container md:grid md:grid-cols-[55%_45%] md:px-5">
				<div className="container relative mx-auto h-80 px-5 md:static">
					<div className={styles.bgRoundedEdge}></div>

					<div className="bg-secondary absolute bottom-24 start-32 grid size-40 place-content-center rounded-full md:start-[calc(28%-12rem)] md:top-20 md:size-96">
						IMAGE 1
					</div>

					<div className="bg-secondary absolute -bottom-8 start-48 grid size-32 place-content-center rounded-full md:start-[calc(13%-8rem)] md:top-[calc(50%-3rem)] md:size-64">
						IMAGE 2
					</div>

					<div className="bg-secondary absolute -bottom-1 start-10 grid size-32 place-content-center rounded-full md:bottom-24 md:start-[calc(29%-8rem)] md:size-64">
						IMAGE 3
					</div>
				</div>

				<div className="pt-18 container mx-auto px-5 pb-10 text-center md:py-60 md:text-start">
					<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered>
						{intro}
					</SectionHeader>

					<Button className="relative mt-12 text-center" asChild>
						<Link href="#!">{cta}</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
