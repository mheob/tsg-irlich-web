'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, MessagesSquare, RotateCcw, UserRound, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { sendContactForm } from '@/actions/send-contact-form';
import { Button } from '@/components/ui/button';
import { InputWithLabel } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { SelectWithLabel } from '@/components/ui/select';
import { TextareaWithLabel } from '@/components/ui/textarea';
import { ErrorAlert, Form, FormField, SuccessAlert } from '@/components/with-logic/form';
import contactImage1 from '@/images/contact/contact-1.webp';
import contactImage2 from '@/images/contact/contact-2.webp';
import contactImage3 from '@/images/contact/contact-3.webp';
import { type ContactFormData, contactFormSchema } from '@/lib/validations/contact-form';
import type { ContactNameMail } from '@/types/sanity.types';

function mapSelectItems(receiver?: ContactNameMail[]): { label: string; value: string }[] {
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
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitResult, setSubmitResult] = useState<null | {
		error?: string;
		identifier?: string;
		success: boolean;
	}>(null);

	const selectItems = mapSelectItems(receiver);

	const form = useForm<ContactFormData>({
		defaultValues: {
			email: '',
			message: '',
			name: '',
			receiver: receiver ? { email: '', label: '' } : undefined,
		},
		resolver: zodResolver(contactFormSchema),
	});

	const onSubmit = async (values: ContactFormData) => {
		setIsSubmitting(true);
		setSubmitResult(null);

		try {
			const result = await sendContactForm({
				email: values.email,
				message: values.message,
				name: values.name,
				receiver: values.receiver ?? undefined,
			});

			if (result?.data) {
				setSubmitResult({
					identifier: result.data.emailId,
					success: true,
				});
				form.reset();
				console.info(`emailId: ${result.data.emailId}`);
			} else {
				setSubmitResult({
					error: result?.serverError || 'Ein Fehler ist aufgetreten',
					success: false,
				});
			}
		} catch {
			setSubmitResult({
				error: 'Verbindungsfehler. Bitte versuche es später erneut.',
				success: false,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const onReset = () => {
		form.reset();
		setSubmitResult(null);
	};

	return (
		<section className="md:bg-background-low-contrast md:py-32">
			<div className="container bg-white">
				<div className="py-10 md:flex md:flex-row-reverse md:rounded-lg md:py-24">
					{submitResult?.success ? (
						<div className="flex-1">
							<SectionHeader
								className="mb-10"
								isCenteredOnDesktop={false}
								title="Kontaktiere uns"
								isCentered
							/>
							<SuccessAlert />
							<Button className="mt-10" disabled={isSubmitting} onClick={onReset}>
								<RotateCcw className="mr-2 mb-1 inline size-5" /> Erneute Anfrage stellen
							</Button>
						</div>
					) : (
						<>
							<div className="hidden lg:relative lg:block lg:w-1/2">
								<div className="bg-secondary absolute top-0 right-0 grid size-60 place-content-center rounded-full lg:size-80">
									<Image
										alt="'FUNKY DIAMONDS'-Spielerin mit geflochtener Frisur und Pferdeschwanz in schwarzem Trikot und Rückennummer 6, telefoniert während eines Spiels."
										className="rounded-full"
										src={contactImage1}
										fill
									/>
								</div>

								<div className="bg-secondary absolute top-[42%] right-[calc(60%-8rem)] grid size-64 place-content-center rounded-full">
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
														onValueChange={value => {
															const selected = selectItems.find(item => item.value === value);
															field?.onChange({ email: value, label: selected?.label ?? '' });
														}}
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

										{submitResult?.error && <ErrorAlert error={submitResult.error} />}

										<Button className="mt-5" disabled={isSubmitting} type="submit" fullWidth>
											{isSubmitting ? (
												<>
													<Loader2 className="mr-2 inline size-6 animate-spin" /> Wird gesendet...
												</>
											) : (
												'Kontaktiere uns'
											)}
										</Button>
									</div>
								</form>
							</Form>
						</>
					)}
				</div>
			</div>
		</section>
	);
}
