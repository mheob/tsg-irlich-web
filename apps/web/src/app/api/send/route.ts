import process from 'node:process';

import { ContactForwardEmail } from '@tsgi-web/email';
import { NextResponse } from 'next/server';

import { resend } from '@/lib/resend';
import { contactFormSchema } from '@/lib/validations/contact-form';

export async function POST(request: Request): Promise<Response> {
	console.log('request', request);

	try {
		const body = await request.json();
		const result = contactFormSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{ error: 'Validation failed', issues: result.error.issues },
				{ status: 400 },
			);
		}

		const { email, message, name, receiver } = result.data;

		const { data, error } = await resend.emails.send({
			bcc: ['it@tsg-irlich.de'],
			from: 'TSG Irlich - Benachrichtigungen <webseite@notifications.tsg-irlich.de>',
			react: ContactForwardEmail({
				baseUrl: process.env.VERCEL_URL ?? 'https://www.tsg-irlich.de',
				contactEmail: email,
				contactMessage: message,
				contactName: name,
				receiver: receiver.label,
			}),
			replyTo: email,
			subject: `Webseiten-Kontaktformular: Neue Nachricht von ${name}`,
			to: ['it@tsg-irlich.de'],
		});

		if (error) {
			return Response.json({ error }, { status: 500 });
		}

		return Response.json(data);
	} catch (error) {
		return Response.json({ error }, { status: 500 });
	}
}
