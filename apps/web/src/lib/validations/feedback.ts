// oxlint-disable no-magic-numbers

import { z } from 'zod';

/** The most screenshots the feedback form accepts, in the upload field and on the server. */
const MAX_SCREENSHOTS = 5;

// zod validates every element of an array before it checks the array's length, and reports each
// failing element as an issue of its own without a cap (CVE-2023-54404). A huge payload would
// therefore allocate one issue per element, so the length is checked first, and the element
// schema behind the pipe only runs on an array that is short enough.
const screenshotUrlsSchema = z
	.custom<string[]>((value) => !Array.isArray(value) || value.length <= MAX_SCREENSHOTS, {
		message: `Es können höchstens ${MAX_SCREENSHOTS} Screenshots angehängt werden`,
	})
	.pipe(z.array(z.string()));

const feedbackFormSchema = z.object({
	browser: z.enum(['chrome', 'firefox', 'edge', 'safari', 'other']).optional(),
	description: z
		.string()
		.min(20, 'Die Beschreibung muss mindestens 20 Zeichen lang sein')
		.max(2000, 'Die Beschreibung darf maximal 2000 Zeichen lang sein'),
	device: z.string().optional(),
	email: z
		.email({ message: 'Bitte gib eine gültige E-Mail-Adresse ein' })
		.optional()
		.or(z.literal('')),
	operationSystem: z.enum(['windows', 'macos', 'linux', 'ios', 'android', 'other']).optional(),
	privacy: z
		.boolean({ message: 'Bitte akzeptiere die Datenschutzbestimmungen' })
		.refine((value) => value),
	screenshotUrls: screenshotUrlsSchema.optional(),
	title: z
		.string()
		.min(5, 'Der Titel muss mindestens 5 Zeichen lang sein')
		.max(100, 'Der Titel darf maximal 100 Zeichen lang sein'),
	type: z.enum(['bug', 'feature', 'question'], { error: 'Bitte wähle einen Typ aus' }),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface LinearIssueResponse {
	error?: string;
	issueId?: string;
	issueIdentifier?: string;
	success: boolean;
}

interface UploadResponse {
	assetUrl?: string;
	error?: string;
	success: boolean;
}

export {
	MAX_SCREENSHOTS,
	feedbackFormSchema,
	type FeedbackFormValues,
	type LinearIssueResponse,
	type UploadResponse,
};
