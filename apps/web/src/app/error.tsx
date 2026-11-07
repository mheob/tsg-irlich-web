'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { StatusMessage } from '@/components/section/status-message';
import { Button, ButtonLink } from '@/components/ui/button';

/**
 * The error boundary of every page. It replaces the page when rendering it fails, for instance
 * because Sanity cannot be reached, and keeps the navigation and the footer of the root layout. A
 * failure in the root layout itself goes to `global-error.tsx`.
 *
 * Error boundaries have to be client components. The error is only logged, as everywhere else in
 * the app; in production a server error arrives without its message, only with its `digest`.
 *
 * @param props - The props Next.js passes to an error boundary.
 * @param props.error - The value that was thrown.
 * @param props.retry - Fetches and renders the page again.
 * @returns The error page.
 */
function ErrorPage({ error, retry }: Readonly<ErrorPageProps>) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<StatusMessage
			code="Fehler"
			description="Beim Laden dieser Seite ist leider etwas schiefgelaufen. Versuch es bitte gleich noch einmal. Klappt es dann immer noch nicht, sag uns Bescheid."
			title="Da ist etwas schiefgelaufen"
		>
			<div className="flex flex-col items-center gap-4 sm:flex-row">
				<Button
					onClick={() => {
						retry();
					}}
				>
					Erneut versuchen
				</Button>
				<ButtonLink render={<Link href="/kontakt" />} variant="secondary">
					Kontakt aufnehmen
				</ButtonLink>
			</div>
		</StatusMessage>
	);
}

interface ErrorPageProps {
	error: unknown;
	retry: () => void;
}

export default ErrorPage;
