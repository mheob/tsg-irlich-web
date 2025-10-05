'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MessagesSquare, UserRound, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { InputWithLabel } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { TextareaWithLabel } from '@/components/ui/textarea';
import { Form, FormField } from '@/components/with-logic/form';
import { SelectWithLabel } from '@/components/with-logic/select';
import integrationImage from '@/images/home/vision/integration.webp';
import sportImage from '@/images/home/vision/sport.webp';
import villageImage from '@/images/home/vision/village.webp';
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
		<section className="bg-background-low-contrast md:py-32">
			<div className="md:container md:mx-auto md:px-5">
				<div className="bg-white px-5 py-10 md:flex md:flex-row-reverse md:rounded-lg md:px-14 md:py-24">
					<div className="hidden md:relative md:block md:w-1/2">
						<div className="bg-secondary absolute end-0 top-0 grid h-80 w-80 place-content-center rounded-full">
							<Image alt="Vision" className="rounded-full" src={integrationImage} fill />
						</div>
						<div className="bg-secondary absolute end-[calc(70%-8rem)] top-1/2 grid h-52 w-52 place-content-center rounded-full">
							<Image alt="Vision" className="rounded-full" src={sportImage} fill />
						</div>
						<div className="bg-secondary absolute bottom-0 end-[calc(25%-8rem)] grid h-52 w-52 place-content-center rounded-full">
							<Image alt="Vision" className="rounded-full" src={villageImage} fill />
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
