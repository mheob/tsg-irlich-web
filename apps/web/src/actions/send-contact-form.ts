'use server';

import process from 'node:process';

import { ContactForwardEmail } from '@tsgi-web/email';

import { actionClient } from '@/lib/actions/safe-action';
import { resend } from '@/lib/resend';
import { contactFormSchema } from '@/lib/validations/contact-form';

export const sendContactForm = actionClient
	.inputSchema(contactFormSchema)
	.action(async ({ parsedInput: data }) => {
		const { email, message, name, receiver } = data;

		const { error } = await resend.emails.send({
			bcc: ['it@tsg-irlich.de'],
			from: 'TSG Irlich - Benachrichtigungen <webseite@notifications.tsg-irlich.de>',
			react: ContactForwardEmail({
				baseUrl: `https://${process.env.VERCEL_URL ?? 'www.tsg-irlich.de'}`,
				contactEmail: email,
				contactMessage: message,
				contactName: name,
				receiver: receiver?.label ?? undefined,
			}),
			replyTo: email,
			subject: `Webseiten-Kontaktformular: Neue Nachricht von ${name}`,
			to: [/*receiver.email,*/ 'it@tsg-irlich.de'],
		});

		if (error) {
			console.error('Resend API error:', error);
			throw new Error('Email could not be sent');
		}
	});
