// oxlint-disable no-magic-numbers

import { z } from 'zod';

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
		.refine((value) => value === true),
	screenshotUrls: z.array(z.string()).optional(),
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
	feedbackFormSchema,
	type FeedbackFormValues,
	type LinearIssueResponse,
	type UploadResponse,
};
