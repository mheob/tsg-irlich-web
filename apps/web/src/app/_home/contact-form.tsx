import { Mail, MessagesSquare, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputWithLabel } from '@/components/ui/input';
import SectionHeader from '@/components/ui/section-header';
import { TextareaWithLabel } from '@/components/ui/textarea';

export default function ContactForm() {
	return (
		<section className="bg-background-lowContrast py-32">
			<div className="container mx-auto px-5">
				<div className="grid grid-cols-[55%,45%] rounded-lg bg-white px-14 py-24">
					<form>
						<SectionHeader title="Kontaktiere uns" />

						<div className="mt-20 flex flex-col gap-10">
							<InputWithLabel id="name" name="name" placeholder="Max Mustermann">
								<UserRound /> Name
							</InputWithLabel>

							<InputWithLabel id="email" name="email" placeholder="max@mustermann.de">
								<Mail /> E-Mail
							</InputWithLabel>

							<TextareaWithLabel
								id="message"
								name="message"
								placeholder="Hallo liebes Team vom HSV Neuwied! Ich bin..."
							>
								<MessagesSquare /> Nachricht
							</TextareaWithLabel>

							<Button className="mt-5" type="submit" fullWidth>
								Kontaktiere uns
							</Button>
						</div>
					</form>

					<div className="relative">
						<div className="bg-secondary absolute right-0 top-0 grid h-80 w-80 place-content-center rounded-full">
							IMAGE 1
						</div>
						<div className="bg-secondary absolute right-[calc(70%-8rem)] top-1/2 grid h-52 w-52 place-content-center rounded-full">
							IMAGE 2
						</div>
						<div className="bg-secondary absolute bottom-0 right-[calc(25%-8rem)] grid h-52 w-52 place-content-center rounded-full">
							IMAGE 3
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
