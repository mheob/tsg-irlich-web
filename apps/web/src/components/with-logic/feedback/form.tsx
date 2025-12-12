'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createLinearIssue } from '@/actions/create-linear-issue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { feedbackFormSchema, type FeedbackFormValues } from '@/lib/validations/feedback';

import { Form } from '../form';
import { BrowserField } from './browse-field';
import { DescriptionField } from './description-field';
import { DeviceField } from './device-field';
import { EmailField } from './email-field';
import { ErrorAlert } from './error-alert';
import { FeedbackTypeField } from './feedback-type';
import { OperationSystemField } from './operations-system-field';
import { ScreenshotsField } from './screenshots-field';
import { Submit } from './submit';
import { SuccessAlert } from './success-alert';
import { TitleField } from './title-field';

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
				browser: data.browser,
				description: data.description,
				device: data.device,
				email: data.email,
				operationSystem: data.operationSystem,
				screenshotUrls: screenshotUrls.length > 0 ? screenshotUrls : undefined,
				title: data.title,
				type: data.type,
			});

			if (result?.data) {
				setSubmitResult({
					identifier: result.data.issueIdentifier,
					success: true,
				});
				form.reset();
				setScreenshotUrls([]);
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
						<SuccessAlert identifier={submitResult.identifier} />
					) : (
						<Form {...form}>
							<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
								<FeedbackTypeField form={form} />
								<TitleField form={form} />
								<DescriptionField form={form} />
								{selectedType === 'bug' && (
									<>
										<BrowserField form={form} />
										<OperationSystemField form={form} />
										<DeviceField form={form} />
									</>
								)}
								<ScreenshotsField
									isSubmitting={isSubmitting}
									screenshotUrls={screenshotUrls}
									setScreenshotUrls={setScreenshotUrls}
								/>
								<EmailField form={form} />
								{submitResult?.error && <ErrorAlert error={submitResult.error} />}
								<Submit isSubmitting={isSubmitting} />
							</form>
						</Form>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
