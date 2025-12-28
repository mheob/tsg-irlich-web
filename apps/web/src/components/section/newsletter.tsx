'use client';

import { cn } from '@tsgi-web/shared';
import { AlertCircle, AtSign, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';

import { type NewsletterFormState, subscribeToNewsletter } from '@/actions/subscribe-to-newsletter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';

import { Alert, AlertDescription } from '../ui/alert';

import styles from './newsletter.module.css';

export function Newsletter() {
	const [state, formAction, isPending] = useActionState<NewsletterFormState, FormData>(
		subscribeToNewsletter,
		null,
	);

	const formReference = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (state?.success) {
			formReference.current?.reset();
		}
	}, [state]);

	return (
		<section className="bg-background-low-contrast md:pt-32">
			<div
				className={cn(
					styles.bg,
					'bg-background relative z-1 mx-auto max-w-(--breakpoint-lg) rounded-lg px-5 pt-10 pb-12 md:-mb-16 md:px-14 md:pt-24',
				)}
			>
				{state && (
					<Alert className="-mt-12 mb-8" variant={state.success ? 'success' : 'destructive'}>
						{state.success ? (
							<Check className="mt-1 size-8! self-start" />
						) : (
							<AlertCircle className="mt-1 size-8! self-start" />
						)}
						<AlertDescription>
							<p>{state.message}</p>
						</AlertDescription>
					</Alert>
				)}

				<SectionHeader
					title="Bleib auf dem Laufenden und lass dich informieren"
					isCentered
					isCenteredOnDesktop
				/>

				<form
					action={formAction}
					className="bg-background relative z-1 mt-16 flex max-w-(--breakpoint-sm) items-center justify-between gap-2 rounded-md px-2 pb-2 shadow-xl md:mx-auto md:gap-6 md:px-6"
					ref={formReference}
				>
					<label
						aria-label="E-Mail"
						className="text-primary sr-only md:not-sr-only"
						htmlFor="email"
					>
						<AtSign />
					</label>

					<Input
						className="flex-1 bg-transparent p-4 text-sm md:text-lg"
						disabled={isPending}
						id="email"
						name="email"
						placeholder="max@mustermann.de"
						type="email"
						required
					/>

					<Button disabled={isPending} type="submit">
						{isPending ? (
							<>
								<Loader2 className="mr-2 inline size-4 animate-spin" /> Wird angemeldet …
							</>
						) : (
							'Abonnieren'
						)}
					</Button>
				</form>

				<p className="text-muted-foreground mx-auto mt-8 text-center text-sm">
					Mit der Anmeldung erklärst Du Dich damit einverstanden, dass wir Dir regelmäßig
					Informationen per E-Mail zusenden. Du kannst Dich jederzeit über den Abmeldelink in jeder
					E-Mail abmelden.{' '}
					<Link className="text-primary hover:text-primary-light" href="/datenschutz">
						Datenschutzerklärung
					</Link>
				</p>
			</div>
		</section>
	);
}
