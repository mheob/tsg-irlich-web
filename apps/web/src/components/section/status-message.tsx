import type { ReactNode } from 'react';

import { SectionHeader } from '@/components/ui/section-header';

/**
 * The body of a page that tells a visitor something went wrong: the not-found page and both error
 * boundaries. None of them has a hero, so the section clears the fixed navigation itself, and its
 * title is the page's only `h1`. It holds no state, so the client-side error boundaries render it as
 * well as the server-rendered not-found page.
 *
 * @param props - The message's props.
 * @param props.children - What the visitor can do next, such as a search form or links.
 * @param props.code - The short label above the title, such as „Fehler 404“.
 * @param props.description - The sentence below the title.
 * @param props.title - The page's heading.
 * @returns The section.
 */
function StatusMessage({ children, code, description, title }: Readonly<StatusMessageProps>) {
	return (
		<section className="container mx-auto flex flex-col items-center gap-10 pt-40 pb-20 md:gap-12 md:pb-28">
			<SectionHeader level="h1" subTitle={code} title={title} isCentered isCenteredOnDesktop>
				{description}
			</SectionHeader>
			{children}
		</section>
	);
}

interface StatusMessageProps {
	children?: ReactNode;
	code: string;
	description: string;
	title: string;
}

export { StatusMessage };
