// oxlint-disable no-magic-numbers

import { z } from 'zod';

const NO_RECEIVER_MESSAGE = 'Kein Empfänger ausgewählt.';

/**
 * The `_key` of an entry in the contact page's receiver list. The form never submits an address:
 * the server action resolves the key against Sanity and refuses one it does not find (WEB-410).
 */
const receiverSchema = z
	.string({ error: NO_RECEIVER_MESSAGE })
	.min(1, { error: NO_RECEIVER_MESSAGE });

export const contactFormSchema = z.object({
	email: z.email({ message: 'Die E-Mail Adresse ist ungültig.' }),
	message: z.string().min(32, { message: 'Die Nachricht muss mindestens 32 Zeichen lang sein.' }),
	name: z.string().min(2, { message: 'Der Name muss mindestens 2 Zeichen lang sein.' }),
	privacy: z
		.boolean({ message: 'Bitte akzeptiere die Datenschutzbestimmungen' })
		.refine((value) => value),
	receiver: receiverSchema.optional(),
});

/** Used where the form offers a receiver select, so picking one stays mandatory there. */
export const contactFormWithReceiverSchema = contactFormSchema.extend({
	receiver: receiverSchema,
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
