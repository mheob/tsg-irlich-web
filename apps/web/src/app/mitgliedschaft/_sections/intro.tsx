import { cn } from '@tsgi-web/shared';

import { PortableText, type PortableTextValue } from '@/components/ui/portable-text';
import type { BlockContent } from '@/types/sanity.types.generated';

interface IntroProps {
	text: BlockContent;
}

export function Intro({ text }: Readonly<IntroProps>) {
	return (
		<section
			className={cn(
				'container my-10 text-lg md:my-32 lg:max-w-6xl',
				'[&>h2]:not-first:mt-12 [&>h2]:mb-8 [&>h2]:text-4xl',
				'[&>h3]:mb-4 [&>h3]:mt-8 [&>h3]:text-2xl',
				'[&>p]:mb-4 [&>p]:max-w-max',
				'[&>p>a]:text-primary-light [&>p>a]:hover:text-primary',
				'[&_li]:text-muted-foreground [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-4 [&_li]:pl-2',
			)}
		>
			<PortableText value={text.text as PortableTextValue} />
		</section>
	);
}

// .container {
//   width: 100%;
//   @media (width >= 40rem /* 640px */) {
//     max-width: 40rem /* 640px */;
//   }
//   @media (width >= 48rem /* 768px */) {
//     max-width: 48rem /* 768px */;
//   }
//   @media (width >= 64rem /* 1024px */) {
//     max-width: 64rem /* 1024px */;
//   }
//   @media (width >= 80rem /* 1280px */) {
//     max-width: 80rem /* 1280px */;
//   }
//   @media (width >= 96rem /* 1536px */) {
//     max-width: 96rem /* 1536px */;
//   }
//   @media (width >= 120rem /* 1920px */) {
//     max-width: 120rem /* 1920px */;
//   }
// }
