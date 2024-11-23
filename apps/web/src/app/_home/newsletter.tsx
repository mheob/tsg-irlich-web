import { AtSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SectionHeader from '@/components/ui/section-header';

import styles from './newsletter.module.css';

export default function Newsletter() {
	return (
		<section className="bg-background-lowContrast pt-32">
			<div
				className={`${styles.bg} relative z-[1] mx-auto -mb-16 max-w-screen-lg rounded-lg bg-white px-14 pb-12 pt-24`}
			>
				<SectionHeader title="Bleib auf dem Laufenden und lass dich informieren" isCentered />

				<form
					className="mx-auto mt-16 flex max-w-screen-sm items-center justify-between gap-6 rounded-md bg-white px-6 pb-2 shadow-xl"
					method="post"
				>
					<label aria-label="E-Mail" className="text-primary" htmlFor="email">
						<AtSign />
					</label>

					<Input
						className="flex-1 p-4 text-lg"
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
