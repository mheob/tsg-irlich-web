import { Img, Link, Text } from 'react-email';

import { CrHtml, CrImage } from '../../lib/cleverreach-tags';

interface NewsCardProps {
	article: {
		category: string;
		href: string;
		imageUrl: string;
		teaser: string;
		title: string;
	};
	imageHeight: number;
	imageWidth: number;
}

export function NewsCard({ article, imageHeight, imageWidth }: Readonly<NewsCardProps>) {
	return (
		<>
			<CrImage>
				<Img
					alt={article.title}
					className="w-full rounded-[8px]"
					height={imageHeight}
					src={article.imageUrl}
					width={imageWidth}
				/>
			</CrImage>

			<CrHtml mode="textonly">
				<Text className="m-0 mt-[12px] font-sans text-[11px] font-bold tracking-[1.5px] text-primary uppercase">
					{article.category}
				</Text>
			</CrHtml>

			<CrHtml>
				<Text className="font-heading m-0 mt-[8px] text-[18px] leading-[24px] text-foreground">
					{article.title}
				</Text>
			</CrHtml>

			<CrHtml>
				<Text className="m-0 mt-[8px] font-sans text-[14px] leading-[21px] text-muted-foreground">
					{article.teaser}
				</Text>
			</CrHtml>

			<CrHtml>
				<Link
					className="mt-[10px] inline-block font-sans text-[14px] font-bold text-primary"
					href={article.href}
				>
					Weiterlesen →
				</Link>
			</CrHtml>
		</>
	);
}
