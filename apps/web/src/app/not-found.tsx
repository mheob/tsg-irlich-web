import type { Metadata } from 'next';
import Link from 'next/link';

import { StatusMessage } from '@/components/section/status-message';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEARCH_MAX_LENGTH } from '@/lib/search/constants';
import { SEARCH_PATH } from '@/lib/search/path';

const SEARCH_INPUT_ID = 'not-found-query';

/** The pages a visitor most likely looked for, linked below the search. */
const SUGGESTED_PAGES = [
	{ href: '/angebot', label: 'Unser Angebot' },
	{ href: '/news', label: 'News' },
	{ href: '/kontakt', label: 'Kontakt' },
] as const;

/*
 * The layout's title template turns the title into „Seite nicht gefunden | TSG Irlich“. There is no
 * canonical URL, since the page answers any address, and Next.js adds `noindex` to every 404 itself.
 */
export const metadata: Metadata = {
	description:
		'Diese Seite gibt es bei der TSG Irlich nicht oder nicht mehr. Die Suche und die Links zu Angebot, News und Kontakt helfen weiter.',
	title: 'Seite nicht gefunden',
};

/**
 * The page for an address that leads nowhere. It answers with status 404 and offers a way on: a
 * plain GET form to the search page, which works without JavaScript, and the most visited pages.
 *
 * @returns The page.
 */
export default function NotFound() {
	return (
		<StatusMessage
			code="Fehler 404"
			description="Die Seite, die du suchst, gibt es nicht oder nicht mehr. Vielleicht hat sich ihre Adresse geändert. Probier es mit der Suche oder schau auf einer dieser Seiten vorbei."
			title="Seite nicht gefunden"
		>
			<form
				action={SEARCH_PATH}
				className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center"
				method="get"
				// The same landmark as the form on the search page; see the comment there.
				// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
				role="search"
			>
				<label className="sr-only" htmlFor={SEARCH_INPUT_ID}>
					Suchbegriff
				</label>
				<Input
					className="h-12 flex-1 border-2 border-primary-light bg-background md:h-14"
					enterKeyHint="search"
					id={SEARCH_INPUT_ID}
					maxLength={SEARCH_MAX_LENGTH}
					name="q"
					placeholder="Wonach suchst du?"
					type="search"
				/>
				<Button type="submit" variant="secondary">
					Suchen
				</Button>
			</form>

			<nav aria-label="Beliebte Seiten">
				<ul className="flex flex-col items-center gap-4 sm:flex-row">
					{SUGGESTED_PAGES.map(({ href, label }) => (
						<li key={href}>
							<ButtonLink render={<Link href={href} />}>{label}</ButtonLink>
						</li>
					))}
				</ul>
			</nav>
		</StatusMessage>
	);
}
