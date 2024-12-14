import { Mail, MessagesSquare, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputWithLabel } from '@/components/ui/input';
import SectionHeader from '@/components/ui/section-header';
import { TextareaWithLabel } from '@/components/ui/textarea';

export default function ContactForm() {
	return (
		<section className="bg-background-low-contrast md:py-32">
			<div className="md:container md:mx-auto md:px-5">
				<div className="bg-white px-5 py-10 md:flex md:flex-row-reverse md:rounded-lg md:px-14 md:py-24">
					<div className="hidden md:relative md:block md:w-1/2">
						<div className="bg-secondary absolute end-0 top-0 grid h-80 w-80 place-content-center rounded-full">
							IMAGE 1
						</div>
						<div className="bg-secondary absolute end-[calc(70%-8rem)] top-1/2 grid h-52 w-52 place-content-center rounded-full">
							IMAGE 2
						</div>
						<div className="bg-secondary absolute bottom-0 end-[calc(25%-8rem)] grid h-52 w-52 place-content-center rounded-full">
							IMAGE 3
						</div>
					</div>

					<form>
						<SectionHeader isCenteredOnDesktop={false} title="Kontaktiere uns" isCentered />

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
				</div>
			</div>
		</section>
	);
}
