import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@tsgi-web/shared';

import { ButtonLink } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { SocialMediaIcon } from '@/components/ui/social-media-icon';
import ArrowCta from '@/icons/design/arrow-cta';
import heroImage from '@/images/home/hero.webp';
import type { Home, SocialMediaQueryResult } from '@/types/sanity.types';
import { getSocialMediaEntries } from '@/utils/icon';

import styles from './hero.module.css';

interface HeroProps extends Pick<Home, 'intro' | 'subtitle' | 'title'> {
	socialMedia: SocialMediaQueryResult;
}

export function Hero({ intro, socialMedia, subtitle, title }: Readonly<HeroProps>) {
	return (
		<section className="relative pt-20 lg:grid lg:min-h-dvh lg:pt-48">
			<div className="pt-5 lg:container lg:grid lg:grid-cols-2">
				<div className="container lg:no-container lg:self-center">
					<SectionHeader level="h1" subTitle={subtitle} title={title}>
						{intro}
					</SectionHeader>

					<div className="mt-8 flex gap-8 text-primary">
						<ButtonLink render={<Link href="/kontakt" />}>Kontakt aufnehmen</ButtonLink>

						<ArrowCta aria-hidden="true" />
					</div>
				</div>

				<div className="relative mt-8 grid lg:static lg:mt-0 lg:grid-cols-[1fr_auto] lg:gap-8">
					<div className={styles.bgRoundedEdge} />
					<div className={styles.bgBalls} />

					{/* `object-contain` keeps the cut-out undistorted in whatever box the viewport leaves it,
					    so it can never grow into the text or the icons beside it. */}
					<div className="relative h-104 sm:h-128 md:h-160 lg:h-[calc(100%+4rem)] lg:max-h-240 lg:self-end">
						<Image
							alt="Eine Taekwondo-Sportlerin, eine Tänzerin und ein Fußballer der TSG Irlich"
							className="object-contain object-bottom"
							fetchPriority="high"
							loading="eager"
							sizes="(min-width: 64rem) 36vw, (min-width: 48rem) 28rem, (min-width: 40rem) 23rem, 19rem"
							src={heroImage}
							fill
						/>
					</div>

					<nav
						aria-label="Social Media"
						className={cn(
							'flex text-white',
							'w-full items-end justify-around justify-self-end py-8',
							'lg:flex-col lg:justify-center lg:gap-10 lg:py-10',
						)}
					>
						{getSocialMediaEntries(socialMedia).map(({ icon, name, url }) => (
							<SocialMediaIcon href={url} icon={icon} key={name} label={name} />
						))}
					</nav>
				</div>
			</div>
		</section>
	);
}
