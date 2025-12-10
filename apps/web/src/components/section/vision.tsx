import { cn } from '@tsgi-web/shared';
// cSpell:words taekwondo
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import visionImage1 from '@/images/vision/vision-1.webp';
import visionImage2 from '@/images/vision/vision-2.webp';
import visionImage3 from '@/images/vision/vision-3.webp';
import type { AboutUs, Home } from '@/types/sanity.types';

import { LongVisionDialog } from './vision.dialog';

import styles from './vision.module.css';

type VisionProps =
	| (AboutUs['content']['visionSection'] & { _type: 'aboutUs' })
	| (Home['content']['visionSection'] & { _type: 'home' });

export function Vision(props: Readonly<VisionProps>) {
	return (
		<section className="relative items-center" id="vision-section">
			<div className="lg:grid lg:grid-cols-[55%_45%] lg:px-5 lg:not-last-of-type:mx-auto">
				<div className="relative mx-auto h-80 px-5 lg:static">
					<div className={styles.bgRoundedEdge}></div>

					<div
						className={cn(
							'absolute',
							'top-5 bottom-24 left-[calc(50%-6rem)] size-40',
							'sm:top-10 sm:left-[calc(50%-6rem)] sm:size-48',
							'md:left-[calc(50%-8rem)] md:size-64',
							'lg:top-20 lg:left-[calc(28%-12rem)] lg:size-80',
						)}
					>
						<Image
							alt="Scheck-Übergabe: TSG Irlich überreicht 250 Euro Spende zum Wiederaufbau des Engerser Lockschuppens."
							className="rounded-full"
							src={visionImage1}
							fill
						/>
					</div>

					<div
						className={cn(
							'absolute',
							'end-8 bottom-8 size-32',
							'sm:end-4 sm:top-[calc(50%-3rem)] sm:size-40',
							'md:size-48',
							'lg:top-[calc(50%-3rem)] lg:left-[calc(13%-8rem)] lg:size-64',
						)}
					>
						<Image
							alt="Tanzgruppe 'Funky Diamonds' der TSG Irlich präsentiert eine Choreografie in rot-weißen Kostümen auf der Bühne"
							className="rounded-full"
							src={visionImage2}
							fill
						/>
					</div>

					<div
						className={cn(
							'absolute',
							'-bottom-4 left-10 size-32',
							'sm:-bottom-4 sm:left-4 sm:size-40',
							'md:-bottom-8 md:size-48',
							'lg:bottom-24 lg:left-[calc(29%-8rem)] lg:size-48',
						)}
					>
						<Image
							alt="Jugend-Fußballmannschaft der TSG Irlich in gelb-blauen Trikots steht Arm in Arm auf dem Sportplatz"
							className="rounded-full"
							src={visionImage3}
							fill
						/>
					</div>
				</div>

				<div className="container mx-auto px-5 pt-18 pb-10 text-center md:py-32 md:text-left">
					<SectionHeader
						isCenteredOnDesktop={false}
						subTitle={props.subtitle}
						title={props.title}
						isCentered
					>
						{props.intro}
					</SectionHeader>

					{props._type === 'home' && (
						<Button className="relative mt-12" asChild>
							<Link href="/verein#vision-section">{props.cta}</Link>
						</Button>
					)}
					{props._type === 'aboutUs' && <LongVisionDialog {...props} />}
				</div>
			</div>
		</section>
	);
}
