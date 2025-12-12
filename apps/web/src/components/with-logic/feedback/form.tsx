'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bug, CheckCircle, HelpCircle, Lightbulb, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createLinearIssue } from '@/actions/create-linear-issue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { feedbackFormSchema, type FeedbackFormValues } from '@/lib/validations/feedback';

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../form';
import { ScreenshotUpload } from './screenshot-upload';

const feedbackTypes = [
	{
		description: 'Etwas funktioniert nicht wie erwartet',
		icon: Bug,
		label: 'Fehlermeldung',
		value: 'bug',
	},
	{
		description: 'Eine Idee für eine Verbesserung',
		icon: Lightbulb,
		label: 'Verbesserungsvorschlag',
		value: 'feature',
	},
	{
		description: 'Ich brauche Hilfe',
		icon: HelpCircle,
		label: 'Frage / Anregung',
		value: 'question',
	},
] as const;

const browserOptions = [
	{ label: 'Chrome', value: 'chrome' },
	{ label: 'Firefox', value: 'firefox' },
	{ label: 'Edge', value: 'edge' },
	{ label: 'Safari', value: 'safari' },
	{ label: 'Anderer Browser', value: 'other' },
] as const;

const operationSystemOptions = [
	{ label: 'Windows', value: 'windows' },
	{ label: 'macOS', value: 'macos' },
	{ label: 'Linux', value: 'linux' },
	{ label: 'iOS', value: 'ios' },
	{ label: 'Android', value: 'android' },
	{ label: 'Anderes Betriebssystem', value: 'other' },
] as const;

export function FeedbackForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
	const [submitResult, setSubmitResult] = useState<null | {
		error?: string;
		identifier?: string;
		success: boolean;
	}>(null);

	const form = useForm<FeedbackFormValues>({
		defaultValues: {
			browser: undefined,
			description: '',
			device: undefined,
			email: '',
			operationSystem: undefined,
			screenshotUrls: [],
			title: '',
			type: undefined,
		},
		resolver: zodResolver(feedbackFormSchema),
	});

	const selectedType = form.watch('type');

	async function onSubmit(data: FeedbackFormValues) {
		setIsSubmitting(true);
		setSubmitResult(null);

		try {
			const result = await createLinearIssue({
				browser: data.browser || undefined,
				description: data.description,
				device: data.device || undefined,
				email: data.email || undefined,
				operationSystem: data.operationSystem || undefined,
				screenshotUrls: screenshotUrls.length > 0 ? screenshotUrls : undefined,
				title: data.title,
				type: data.type,
			});

			if (result.success) {
				setSubmitResult({
					identifier: result.issueIdentifier,
					success: true,
				});
				form.reset();
				setScreenshotUrls([]);
			} else {
				setSubmitResult({
					error: result.error || 'Ein Fehler ist aufgetreten',
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
	}

	return (
		<section className="md:bg-background-low-contrast md:py-32">
			<Card className="container">
				<CardHeader>
					<CardTitle className="mb-4 text-3xl leading-tight md:mb-8 md:text-7xl">
						Gib uns dein Feedback zur neuen Webseite
					</CardTitle>

					<CardDescription className="text-muted-foreground text-lg md:text-xl">
						Hilf uns, die App zu verbessern. Dein Feedback ist sehr wertvoll!
					</CardDescription>
				</CardHeader>

				<CardContent className="mt-10 md:mt-20">
					{submitResult?.success ? (
						<Alert variant="success">
							<CheckCircle className="size-6" />
							<AlertTitle>Vielen Dank!</AlertTitle>
							<AlertDescription className="mt-2">
								Dein Feedback wurde erfolgreich übermittelt.
								{submitResult.identifier && (
									<span className="mt-2 block text-base md:text-lg">{`Deine Ticketnummer für Nachfragen lautet: ${submitResult.identifier}.`}</span>
								)}
							</AlertDescription>
						</Alert>
					) : (
						<Form {...form}>
							<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
								{/* Feedback Type */}
								<FormField
									render={({ field }) => (
										<FormItem>
											<FormLabel>Art des Feedbacks</FormLabel>
											<FormControl>
												<ToggleGroup
													className="flex-col items-start justify-start sm:flex-row sm:items-center"
													onValueChange={field.onChange}
													type="single"
													value={field.value}
												>
													{feedbackTypes.map(type => (
														<ToggleGroupItem
															aria-label={type.label}
															className="flex items-center gap-2 px-4"
															key={type.value}
															value={type.value}
														>
															<type.icon className="h-4 w-4" />
															{type.label}
														</ToggleGroupItem>
													))}
												</ToggleGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
									control={form.control}
									name="type"
								/>

								{/* Title */}
								<FormField
									render={({ field }) => (
										<FormItem>
											<FormLabel>Titel</FormLabel>
											<FormControl>
												<Input placeholder="Kurze Zusammenfassung..." {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
									control={form.control}
									name="title"
								/>

								{/* Description */}
								<FormField
									render={({ field }) => (
										<FormItem>
											<FormLabel>Beschreibung</FormLabel>
											<FormControl>
												<Textarea
													placeholder={
														selectedType === 'bug'
															? 'Was ist passiert? Wie kann ich das Problem reproduzieren?'
															: selectedType === 'feature'
																? 'Beschreibe deine Idee...'
																: 'Wie können wir dir helfen?'
													}
													className="min-h-[120px] resize-y"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Je mehr Details, desto besser können wir helfen.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
									control={form.control}
									name="description"
								/>

								{/* Severity (only for bugs) */}
								{selectedType === 'bug' && (
									<>
										{/* Browser */}
										<FormField
											render={({ field }) => (
												<FormItem>
													<FormLabel>Browser</FormLabel>
													<Select defaultValue={field.value} onValueChange={field.onChange}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Welcher Browser wird verwendet?" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{browserOptions.map(option => (
																<SelectItem key={option.value} value={option.value}>
																	{option.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
											control={form.control}
											name="browser"
										/>

										{/* Operating System */}
										<FormField
											render={({ field }) => (
												<FormItem>
													<FormLabel>Betriebssystem</FormLabel>
													<Select defaultValue={field.value} onValueChange={field.onChange}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Welches Betriebssystem wird verwendet?" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{operationSystemOptions.map(option => (
																<SelectItem key={option.value} value={option.value}>
																	{option.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
											control={form.control}
											name="operationSystem"
										/>

										{/* Device */}
										<FormField
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Gerät{' '}
														<span className="text-muted-foreground text-base md:text-lg">
															(z. B. iPhone 13 Pro, iPad Pro 13" oder Samsung S25 etc.)
														</span>
													</FormLabel>
													<FormControl>
														<Input placeholder="Welches Gerät wird verwendet?" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
											control={form.control}
											name="device"
										/>
									</>
								)}

								{/* Screenshot Upload */}
								<FormItem>
									<FormLabel>
										Screenshots{' '}
										<span className="text-muted-foreground text-base md:text-lg">(optional)</span>
									</FormLabel>
									<ScreenshotUpload
										disabled={isSubmitting}
										maxFiles={5}
										onChange={setScreenshotUrls}
										value={screenshotUrls}
									/>
									<FormDescription>
										Füge Screenshots hinzu, um das Problem zu verdeutlichen.
									</FormDescription>
								</FormItem>

								{/* Email (optional) */}
								<FormField
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												E-Mail{' '}
												<span className="text-muted-foreground text-base md:text-lg">
													(optional)
												</span>
											</FormLabel>
											<FormControl>
												<Input placeholder="deine@email.de" type="email" {...field} />
											</FormControl>
											<FormDescription>
												Falls wir Rückfragen haben oder dich über den Status informieren sollen.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
									control={form.control}
									name="email"
								/>

								{/* Error Alert */}
								{submitResult?.error && (
									<Alert variant="destructive">
										<AlertTitle>Fehler</AlertTitle>
										<AlertDescription>{submitResult.error}</AlertDescription>
									</Alert>
								)}

								{/* Submit Button */}
								<Button className="mt-5 md:mt-10" disabled={isSubmitting} type="submit" fullWidth>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 inline size-6 animate-spin" />
											Wird gesendet...
										</>
									) : (
										'Feedback senden'
									)}
								</Button>
							</form>
						</Form>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
