import { cn } from '@tsgi-web/shared';
import { FileText } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { getDownloadFileUrl, getFileSize } from '@/lib/sanity/utils';
import type { MembershipPageQueryResult } from '@/types/sanity.types.generated';

export type MembershipDownload = NonNullable<MembershipPageQueryResult['membership']>;

interface DownloadCardProps {
	download: MembershipDownload['downloadsSection']['downloads'][number];
}

export function DownloadCard({ download }: Readonly<DownloadCardProps>) {
	return (
		<Link
			aria-label={`Das PDF "${download.title}" herunterladen`}
			className={cn('flex flex-1')}
			href={getDownloadFileUrl(download.document.asset)}
		>
			<Card
				className={cn(
					'flex flex-1 flex-col items-center justify-between gap-8',
					'hover:bg-primary hover:text-primary-foreground',
					'transition-colors',
				)}
			>
				<header className="flex flex-col items-center">
					<FileText aria-hidden="true" size={60} strokeWidth={1} />
					<CardTitle className="mt-4 text-center text-xl uppercase md:text-3xl">
						{download.title}
					</CardTitle>
				</header>

				<CardContent className="mt-2 italic group-hover:text-white md:text-lg">
					Dateigröße: {getFileSize(download.document.asset?.size)}
				</CardContent>
			</Card>
		</Link>
	);
}
