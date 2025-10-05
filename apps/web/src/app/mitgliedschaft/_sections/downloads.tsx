import { SectionHeader } from '@/components/ui/section-header';

import { DownloadCard, type MembershipDownload } from './download-card';

import styles from './downloads.module.css';

type DownloadsProps = MembershipDownload['downloadsSection'];

export function Downloads({ downloads, intro, subtitle, title }: Readonly<DownloadsProps>) {
	return (
		<section className="bg-background-low-contrast relative z-0">
			<div className={styles.bg}></div>
			<div className={styles.bgBalls}></div>

			<div className="container mx-auto py-10 md:py-28">
				<SectionHeader subTitle={subtitle} title={title} isCentered isCenteredOnDesktop>
					{intro}
				</SectionHeader>

				<div className="mt-16 grid grid-cols-1 place-content-center gap-12 lg:grid-cols-3">
					{downloads?.map(download => {
						if (!download) return null;
						return <DownloadCard download={download} key={download._key} />;
					})}
				</div>
			</div>
		</section>
	);
}
