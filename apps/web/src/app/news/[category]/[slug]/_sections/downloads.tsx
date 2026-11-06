import { Download, FileText } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@tsgi-web/shared';

import { getDownloadFileUrl, getFileSize } from '@/lib/sanity/utils';
import type { NewsArticleContentQueryResult } from '@/types/sanity.types';

type ArticleDownloads = NonNullable<NewsArticleContentQueryResult>['downloads'];

interface DownloadsProps extends ComponentPropsWithoutRef<'section'> {
	downloads: ArticleDownloads;
}

// The PDF files offered below an article (WEB-277). The article text carries the content, these
// only add to it, so the list stays out of the way when an article has none.
export function Downloads({ className, downloads, ...props }: Readonly<DownloadsProps>) {
	// A download whose asset was deleted resolves to `null` and would only link to nothing.
	const files = downloads?.filter((download) => download.document.asset?.url) ?? [];

	if (files.length === 0) {
		return null;
	}

	return (
		<section className={cn('not-prose mt-10', className)} {...props}>
			<h2 className="text-2xl font-bold uppercase">Downloads</h2>

			<ul className="mt-4 divide-y border-y">
				{files.map((download) => (
					<li key={download._key}>
						<a
							className="flex items-center gap-4 py-4 transition-colors hover:text-primary"
							href={getDownloadFileUrl(download.document.asset)}
						>
							<FileText aria-hidden="true" className="shrink-0" size={40} strokeWidth={1} />
							<div className="flex grow flex-col">
								<div className="text-lg font-bold">{download.title}</div>
								<div className="text-sm text-muted-foreground">
									PDF, {getFileSize(download.document.asset?.size)}
								</div>
							</div>
							<Download aria-hidden="true" className="shrink-0" size={24} />
							{/* The name starts with what the row shows (WCAG 2.5.3) and ends with what it does. */}
							<span className="sr-only">herunterladen</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}

export type { ArticleDownloads };
