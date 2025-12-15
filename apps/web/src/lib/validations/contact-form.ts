import { z } from 'zod';

export const contactFormSchema = z.object({
	email: z.email({ message: 'Die E-Mail Adresse ist ungültig.' }),
	message: z.string().min(32, { message: 'Die Nachricht muss mindestens 32 Zeichen lang sein.' }),
	name: z.string().min(2, { message: 'Der Name muss mindestens 2 Zeichen lang sein.' }),
	receiver: z
		.object({
			email: z.email({ message: 'Kein Empfänger ausgewählt.' }),
			label: z.string({ message: 'Kein Empfänger ausgewählt.' }),
		})
		.optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
