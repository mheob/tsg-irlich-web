import Link from 'next/link';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import NewsArticlePreviewWide from '@/components/ui/news-article-preview-wide';
import SectionHeader from '@/components/ui/section-header';

import styles from './news.module.css';

const articles: ComponentProps<typeof NewsArticlePreviewWide>[] = [
	{
		author: {
			firstName: 'Sophie',
			imageSrc:
				'https://next.tsg-irlich.de/_vercel/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fj4rxwl5m%2Fproduction%2F9624f0c95d046382b94498d4c69bf6533245ad53-4000x6000.jpg%3Frect%3D611%2C915%2C2925%2C2925%26w%3D56%26h%3D56&w=160&q=100',
			lastName: 'Thomé',
		},
		categories: [
			{
				slug: '/verein',
				title: 'Gesamtverein',
			},
		],
		excerpt: 'Die TSG Irlich geht mit der Zeit und ist seit März 2024 auch auf WhatsApp zu finden.',
		featuredImageSrc:
			'https://next.tsg-irlich.de/_vercel/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fj4rxwl5m%2Fproduction%2F729d5d8f726d22629d0ee760715b587812356289-1080x1080.png%3Frect%3D0%2C236%2C1080%2C608%26w%3D800%26h%3D450&w=640&q=100',
		slug: '/news/tsg-irlich-startet-whatsapp-channel',
		title: 'TSG Irlich startet WhatsApp-Channel',
	},
	{
		author: {
			firstName: 'Sophie',
			imageSrc:
				'https://next.tsg-irlich.de/_vercel/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fj4rxwl5m%2Fproduction%2F9624f0c95d046382b94498d4c69bf6533245ad53-4000x6000.jpg%3Frect%3D611%2C915%2C2925%2C2925%26w%3D56%26h%3D56&w=160&q=100',
			lastName: 'Thomé',
		},
		categories: [
			{
				slug: '/verein',
				title: 'Gesamtverein',
			},
		],
		excerpt: 'Am 12. August 2023 fand wie jedes Jahr das traditionelle Rheiunferfest statt.',
		featuredImageSrc:
			'https://next.tsg-irlich.de/_vercel/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fj4rxwl5m%2Fproduction%2F6e088b2064ce66af3238e7ece470105407a08c7d-4000x2250.jpg%3Fw%3D800%26h%3D450&w=640&q=100',
		slug: '/news/rheinuferfest-2023-irlich-feiert-1000-jahriges-bestehen',
		title: 'Rheinuferfest 2023 - Irlich feiert 1000 jähriges Bestehen',
	},
	{
		author: {
			firstName: 'Sophie',
			imageSrc:
				'https://next.tsg-irlich.de/_vercel/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fj4rxwl5m%2Fproduction%2F9624f0c95d046382b94498d4c69bf6533245ad53-4000x6000.jpg%3Frect%3D611%2C915%2C2925%2C2925%26w%3D56%26h%3D56&w=160&q=100',
			lastName: 'Thomé',
		},
		categories: [
			{
				slug: '/verein',
				title: 'Gesamtverein',
			},
		],
		excerpt:
			'Bei bestem Wetter startete am 9. Mai 2024 das traditionelle Vaddertachsturnier im Irlicher Pappelstadion!',
		featuredImageSrc:
			'https://next.tsg-irlich.de/_vercel/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fj4rxwl5m%2Fproduction%2F973790f369efeaae3d9b3bde76b704aacdc8b6c3-6000x4000.jpg%3Frect%3D308%2C474%2C4978%2C2800%26w%3D800%26h%3D450&w=640&q=100',
		slug: '/news/tsg-irlich-startet-whatsapp-channel-2',
		title: 'TSG-Vaddertach bei bestem Wetter!',
	},
];

export default function News() {
	return (
		<section className={`${styles.bg} bg-primary relative z-0 text-white`}>
			<div className="container mx-auto px-5 pb-40 pt-28">
				<SectionHeader
					descriptionClassName="text-white"
					subTitle={'Aktuelles'}
					title={'Neuigkeiten rund um die TSG'}
					isCentered
				>
					Lorem ipsum dolor sit amet consectetur. Adipiscing in eu tempus feugiat enim placerat.
					Cursus commodo lorem sit fringilla augue.
				</SectionHeader>

				<div className="mt-32 flex flex-col justify-center gap-12">
					{articles.map(article => (
						<NewsArticlePreviewWide key={article.slug} {...article} />
					))}
				</div>

				<footer className="mt-20 text-center">
					<Button variant="secondary" asChild>
						<Link href="#!">Alle Neuigkeiten ansehen</Link>
					</Button>
				</footer>
			</div>
		</section>
	);
}
