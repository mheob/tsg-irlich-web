'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MessagesSquare, UserRound, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { InputWithLabel } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { SelectWithLabel } from '@/components/ui/select';
import { TextareaWithLabel } from '@/components/ui/textarea';
import { Form, FormField } from '@/components/with-logic/form';
import contactImage1 from '@/images/contact/contact-1.webp';
import contactImage2 from '@/images/contact/contact-2.webp';
import contactImage3 from '@/images/contact/contact-3.webp';
import type { ContactNameMail } from '@/types/sanity.types';

const formSchema = z.object({
	email: z.email({ message: 'Die E-Mail Adresse ist ungültig.' }),
	message: z.string().min(32, { message: 'Die Nachricht muss mindestens 32 Zeichen lang sein.' }),
	name: z.string().min(2, { message: 'Der Name muss mindestens 2 Zeichen lang sein.' }),
	receiver: z.email({ message: 'Kein Empfänger ausgewählt.' }),
});

type FormSchema = z.infer<typeof formSchema>;

function mapSelectItems(receiver?: ContactNameMail[]) {
	return (
		receiver?.map(({ email, name }) => ({
			label: name,
			value: email,
		})) ?? []
	);
}

interface ContactFormProps {
	receiver?: ContactNameMail[];
}

export function ContactForm({ receiver }: Readonly<ContactFormProps>) {
	const selectItems = mapSelectItems(receiver);

	const form = useForm<FormSchema>({
		defaultValues: {
			email: '',
			message: '',
			name: '',
			receiver: '',
		},
		resolver: zodResolver(formSchema),
	});

	function onSubmit(values: FormSchema) {
		// Do something with the form values.
		// ✅ This will be type-safe and validated.
		console.log(values);
	}

	return (
		<section className="md:bg-background-low-contrast md:py-32">
			<div className="container bg-white">
				<div className="py-10 md:flex md:flex-row-reverse md:rounded-lg md:py-24">
					<div className="hidden lg:relative lg:block lg:w-1/2">
						<div className="bg-secondary absolute top-0 right-0 grid size-60 place-content-center rounded-full lg:size-80">
							<Image
								alt="'FUNKY DIAMONDS'-Spielerin mit geflochtener Frisur und Pferdeschwanz in schwarzem Trikot und Rückennummer 6, telefoniert während eines Spiels."
								className="rounded-full"
								src={contactImage1}
								fill
							/>
						</div>
						<div className="bg-secondary absolute top-1/2 right-[calc(60%-8rem)] grid size-64 place-content-center rounded-full">
							<Image
								alt="Gruppe der TSG Irlich in blauen Trikots posiert für ein Mannschaftsfoto auf dem Spielfeld, während eine Fotografin in schwarzem Kleid mit Kamera auf Stativ das Foto macht."
								className="rounded-full"
								src={contactImage2}
								fill
							/>
						</div>
						<div className="bg-secondary absolute right-[calc(30%-8rem)] bottom-0 grid size-52 place-content-center rounded-full">
							<Image
								alt="PR-Team-Mitglied der TSG Irlich in blau-weißem Vereinstrikot mit Kamera auf Stativ bei der Arbeit im Freien."
								className="rounded-full"
								src={contactImage3}
								fill
							/>
						</div>
					</div>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<SectionHeader isCenteredOnDesktop={false} title="Kontaktiere uns" isCentered />

							<div className="mt-10 flex flex-col gap-10 md:mt-20">
								<FormField
									render={({ field }) => (
										<InputWithLabel field={field} placeholder="Max Mustermann">
											<UserRound /> Name
										</InputWithLabel>
									)}
									control={form.control}
									name="name"
								/>

								<FormField
									render={({ field }) => (
										<InputWithLabel field={field} placeholder="max@mustermann.de">
											<Mail /> E-Mail
										</InputWithLabel>
									)}
									control={form.control}
									name="email"
								/>

								{receiver && (
									<FormField
										render={({ field }) => (
											<SelectWithLabel
												field={field}
												placeholder="Wähle eine Empfängergruppe"
												selectItems={selectItems}
												wrapperClassName="w-full"
											>
												<UsersRound /> Empfänger
											</SelectWithLabel>
										)}
										control={form.control}
										name="receiver"
									/>
								)}

								<FormField
									render={({ field }) => (
										<TextareaWithLabel
											field={field}
											placeholder="Hallo liebes Team von der TSG Irlich! Ich wende mich folgendem Anliegen an euch..."
										>
											<MessagesSquare /> Nachricht
										</TextareaWithLabel>
									)}
									control={form.control}
									name="message"
								/>

								<Button className="mt-5" type="submit" fullWidth>
									Kontaktiere uns
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</div>
		</section>
	);
}
