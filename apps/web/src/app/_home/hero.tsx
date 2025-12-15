import { cn } from '@tsgi-web/shared';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { SocialMediaIcon } from '@/components/ui/social-media-icon';
import ArrowCta from '@/icons/design/arrow-cta';
import type { Home, SocialMediaQueryResult } from '@/types/sanity.types';
import { getSocialMediaIcon } from '@/utils/icon';

import styles from './hero.module.css';

interface HeroProps extends Pick<Home, 'intro' | 'subtitle' | 'title'> {
	socialMedia: SocialMediaQueryResult;
}

export async function Hero({ intro, socialMedia, subtitle, title }: Readonly<HeroProps>) {
	return (
		<section className="relative pt-20 lg:grid lg:h-dvh lg:pt-48">
			<div className="items-center pt-5 lg:container lg:flex">
				<div className="lg:no-container container lg:w-3/5">
					<SectionHeader level="h1" subTitle={subtitle} title={title}>
						{intro}
					</SectionHeader>

					<div className="text-primary mt-8 flex gap-8">
						<Button asChild>
							<Link href="/kontakt">Kontakt aufnehmen</Link>
						</Button>

						<ArrowCta aria-hidden="true" />
					</div>
				</div>

				<div className="relative grid h-96 lg:static lg:ml-auto">
					<div className={styles.bgRoundedEdge}></div>
					<div className={styles.bgBalls}></div>

					<nav
						className={cn(
							'flex text-white',
							'w-full items-end justify-around justify-self-end py-10',
							'lg:flex-col lg:justify-center lg:gap-10',
						)}
					>
						{socialMedia &&
							Object.entries(socialMedia).map(([name, url]) => (
								<SocialMediaIcon
									href={url}
									icon={getSocialMediaIcon(name)}
									key={url}
									label={name}
								/>
							))}
					</nav>
				</div>
			</div>
		</section>
	);
}
