'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { settle } from '@tsgi-web/shared';
import type { Settled } from '@tsgi-web/shared';

import { submitForm } from '@/actions/submit-form';
import { Button } from '@/components/ui/button';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { buildFormSchema, getDefaultValues } from '@/lib/forms/build-form-schema';
import type { FormFieldDefinition, FormValues } from '@/lib/forms/types';

import { ErrorAlert, Form, SuccessAlert } from '../form';
import { FieldRenderer } from './field-renderer';
import { GroupField } from './group-field';
import { HONEYPOT_NAME, Honeypot } from './honeypot';

const SEND_ERROR = 'Die Anmeldung konnte nicht gesendet werden. Bitte versuche es später erneut.';
const UNAVAILABLE_ERROR = 'Die Anmeldung ist gerade nicht möglich. Bitte lade die Seite neu.';
const PREVIEW_HINT = 'In der Vorschau kann nichts abgesendet werden.';

type SubmitResult = null | { error: string } | { status: 'registered' | 'waitlist' };

/**
 * What the visitor is told after the action has answered. A form that closed or has not opened
 * since the page was rendered asks for a reload, which shows the page's own text for that state.
 *
 * @param outcome - How the call to the action ended.
 * @returns The confirmation to show, or the error.
 */
function getSubmitResult(outcome: Settled<Awaited<ReturnType<typeof submitForm>>>): SubmitResult {
	const status = outcome.ok ? outcome.value.data?.status : undefined;
	if (status === 'registered' || status === 'waitlist') {
		return { status };
	}
	return { error: status === 'closed' || status === 'upcoming' ? UNAVAILABLE_ERROR : SEND_ERROR };
}

/**
 * The registration form of a Sanity form document: its fields in the editor's order, validated
 * with the schema they build, and sent to `submitForm`. A successful submission replaces the form
 * with the confirmation for where it landed.
 *
 * Like the contact form it only submits once hydrated, posts if the browser ever sends it itself,
 * and leaves the checks to the schema. In the preview nothing can be submitted at all, since the
 * action would store a real submission for the published form.
 *
 * @param props - The form's props.
 * @param props.fields - The fields as the form query projects them.
 * @param props.formId - The `_id` of the form document the submission belongs to.
 * @param props.isPreview - Whether the page is shown in draft mode, where nothing may be submitted.
 * @param props.isWaitlist - Whether the form is full, so a submission lands on the waitlist.
 * @param props.successText - The confirmation of a registration.
 * @param props.waitlistSuccessText - The confirmation of a place on the waitlist.
 * @returns The form, or the confirmation once it was sent.
 */
function RegistrationForm({
	fields,
	formId,
	isPreview = false,
	isWaitlist,
	successText,
	waitlistSuccessText,
}: Readonly<RegistrationFormProps>) {
	const isHydrated = useIsHydrated();
	const previewHintId = useId();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<SubmitResult>(null);
	const options = useMemo(
		() => ({
			defaultValues: getDefaultValues(fields),
			resolver: zodResolver(buildFormSchema(fields)),
		}),
		[fields],
	);
	const form = useForm<FormValues>(options);

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		setResult(null);
		const website: unknown = form.getValues(HONEYPOT_NAME);
		const outcome = await settle(
			submitForm({ formId, values, website: typeof website === 'string' ? website : '' }),
		);
		setIsSubmitting(false);
		setResult(getSubmitResult(outcome));
	};

	if (result && 'status' in result) {
		return (
			<SuccessAlert title={null}>
				<p className="whitespace-pre-line">
					{result.status === 'waitlist' ? waitlistSuccessText : successText}
				</p>
			</SuccessAlert>
		);
	}

	return (
		<Form {...form}>
			<form
				className="relative grid gap-6 md:grid-cols-2"
				method="post"
				onSubmit={form.handleSubmit(onSubmit)}
				noValidate
			>
				{fields.map((field) =>
					field._type === 'formFieldGroup' ? (
						<GroupField field={field} key={field._key} />
					) : (
						<FieldRenderer field={field} key={field._key} name={field._key} />
					),
				)}

				<Honeypot />

				{result && (
					<div className="md:col-span-2">
						<ErrorAlert error={result.error} />
					</div>
				)}

				<div className="grid gap-3 md:col-span-2">
					<Button
						aria-describedby={isPreview ? previewHintId : undefined}
						className="justify-self-start"
						disabled={!isHydrated || isSubmitting || isPreview}
						type="submit"
					>
						{isSubmitting && (
							<Loader2 aria-hidden="true" className="mr-2 inline size-5 animate-spin" />
						)}
						{isWaitlist ? 'Auf die Warteliste' : 'Anmelden'}
					</Button>
					{isPreview && (
						<p className="text-muted-foreground" id={previewHintId}>
							{PREVIEW_HINT}
						</p>
					)}
				</div>
			</form>
		</Form>
	);
}

interface RegistrationFormProps {
	fields: FormFieldDefinition[];
	formId: string;
	isPreview?: boolean;
	isWaitlist: boolean;
	successText: string;
	waitlistSuccessText: string;
}

export { RegistrationForm };
