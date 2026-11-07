'use client';

import { useEffect } from 'react';

import { cn } from '@tsgi-web/shared';

import { StatusMessage } from '@/components/section/status-message';
import { Button, ButtonLink } from '@/components/ui/button';

import { fontVariables } from './_assets/fonts/fonts';

// oxlint-disable-next-line import/no-unassigned-import
import './globals.css';

/**
 * The error boundary of the root layout. It only shows when the layout itself fails, and then it
 * replaces the whole document: it renders its own `<html>` and `<body>`, loads the global styles
 * and the fonts itself, and reads no data, since whatever the layout fetches may be what failed.
 * Navigation and footer are missing for the same reason, so the link to the contact page is a plain
 * anchor that loads the page from scratch.
 *
 * A client component cannot export `metadata`, so the title is React's `<title>` element.
 *
 * @param props - The props Next.js passes to an error boundary.
 * @param props.error - The value that was thrown.
 * @param props.retry - Fetches and renders the layout and the page again.
 * @returns The error document.
 */
function GlobalError({ error, retry }: Readonly<GlobalErrorProps>) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="de">
			<body className={cn(fontVariables, 'flex min-h-screen flex-col antialiased')}>
				<title>Fehler | TSG Irlich</title>
				<main className="grid flex-1">
					<StatusMessage
						code="Fehler"
						description="Die Website der TSG Irlich ist gerade nicht erreichbar. Versuch es bitte gleich noch einmal. Klappt es dann immer noch nicht, sag uns Bescheid."
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
							<ButtonLink href="/kontakt" variant="secondary">
								Kontakt aufnehmen
							</ButtonLink>
						</div>
					</StatusMessage>
				</main>
			</body>
		</html>
	);
}

interface GlobalErrorProps {
	error: unknown;
	retry: () => void;
}

export default GlobalError;
