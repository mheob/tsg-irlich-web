import { cn } from '@tsgi-web/shared';
import { AtSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';

import styles from './newsletter.module.css';

export function Newsletter() {
	return (
		<section className="bg-background-low-contrast md:pt-32">
			<div
				className={cn(
					styles.bg,
					'relative z-1 mx-auto max-w-(--breakpoint-lg) rounded-lg bg-white px-5 pt-10 pb-12 md:-mb-16 md:px-14 md:pt-24',
				)}
			>
				<SectionHeader
					title="Bleib auf dem Laufenden und lass dich informieren"
					isCentered
					isCenteredOnDesktop
				/>

				<form
					className="relative z-1 mt-16 flex max-w-(--breakpoint-sm) items-center justify-between gap-2 rounded-md bg-white px-2 pb-2 shadow-xl md:mx-auto md:gap-6 md:px-6"
					method="post"
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
						id="email"
						name="email"
						placeholder="max@mustermann.de"
						type="email"
					/>

					<Button type="submit">Abonnieren</Button>
				</form>
			</div>
		</section>
	);
}
