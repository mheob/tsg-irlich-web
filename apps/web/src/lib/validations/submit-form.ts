import { z } from 'zod';

/**
 * What the public form sends. `values` is checked against the schema the form's own fields
 * build (`buildFormSchema`), so here it stays open. `website` is the honeypot: a human never
 * sees the field, so a value in it marks a bot.
 */
const submitFormInputSchema = z.object({
	formId: z.string().min(1),
	values: z.record(z.string(), z.unknown()),
	website: z.string().optional(),
});

/** What the visitor is told: stored as registered or on the waitlist, or not stored at all. */
type SubmitFormStatus = 'closed' | 'registered' | 'upcoming' | 'waitlist';

export { submitFormInputSchema };
export type { SubmitFormStatus };
