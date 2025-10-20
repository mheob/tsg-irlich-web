// cSpell:words taekwondo

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import taekwondoImage from '@/images/home/vision/taekwondo.webp';
import teamworkImage from '@/images/home/vision/teamwork.webp';
import zusammenhaltImage from '@/images/home/vision/zusammenhalt.webp';
import type { Home } from '@/types/sanity.types';

import styles from './vision.module.css';

type VisionProps = Home['content']['visionSection'];

export function Vision({ cta, intro, subtitle, title }: Readonly<VisionProps>) {
	return (
		<section className="relative items-center">
			<div className="md:container md:grid md:grid-cols-[55%_45%] md:px-5 md:not-last-of-type:mx-auto">
				<div className="relative container mx-auto h-80 px-5 md:static">
					<div className={styles.bgRoundedEdge}></div>

					<div className="absolute start-32 bottom-24 size-40 md:start-[calc(28%-12rem)] md:top-20 md:size-96">
						<Image alt="Vision" className="rounded-full" src={taekwondoImage} fill />
					</div>

					<div className="absolute start-48 -bottom-8 size-32 md:start-[calc(13%-8rem)] md:top-[calc(50%-3rem)] md:size-64">
						<Image alt="Vision" className="rounded-full" src={teamworkImage} fill />
					</div>

					<div className="absolute start-10 -bottom-1 size-32 md:start-[calc(29%-8rem)] md:bottom-24 md:size-64">
						<Image alt="Vision" className="rounded-full" src={zusammenhaltImage} fill />
					</div>
				</div>

				<div className="container mx-auto px-5 pt-18 pb-10 text-center md:py-60 md:text-start">
					<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered>
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
