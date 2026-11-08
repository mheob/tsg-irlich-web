import { z } from 'zod';

/**
 * What the public form sends. `values` is checked against the schema the form's own fields
 * build (`buildFormSchema`), so here it stays open. `hp_confirm` is the honeypot: a human never
 * sees the field, so a value in it marks a bot. Its name is no word a browser fills in by itself,
 * as it might with `website` or `email`.
 */
const submitFormInputSchema = z.object({
	formId: z.string().min(1),
	hp_confirm: z.string().optional(),
	values: z.record(z.string(), z.unknown()),
});

/** What the visitor is told: stored as registered or on the waitlist, or not stored at all. */
type SubmitFormStatus = 'closed' | 'registered' | 'upcoming' | 'waitlist';

export { submitFormInputSchema };
export type { SubmitFormStatus };
