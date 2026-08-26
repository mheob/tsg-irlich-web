import { describe, expect, it } from 'vitest';

import { feedbackFormSchema } from '@/lib/validations/feedback';

const MINIMAL_PAYLOAD = {
	description: 'x'.repeat(20),
	privacy: true,
	title: 'abcde',
	type: 'bug',
};

describe('the feedback form schema', () => {
	it('parses a minimal payload with only the required fields', () => {
		const result = feedbackFormSchema.safeParse(MINIMAL_PAYLOAD);

		expect(result.success).toBe(true);
	});

	it('rejects a title of 4 characters', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, title: 'abcd' });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('Der Titel muss mindestens 5 Zeichen lang sein');
	});

	it('accepts a title of exactly 5 characters', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, title: 'abcde' });

		expect(result.success).toBe(true);
	});

	it('accepts a title of exactly 100 characters', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, title: 'a'.repeat(100) });

		expect(result.success).toBe(true);
	});

	it('rejects a title of 101 characters', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, title: 'a'.repeat(101) });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('Der Titel darf maximal 100 Zeichen lang sein');
	});

	it('rejects a description of 19 characters', () => {
		const result = feedbackFormSchema.safeParse({
			...MINIMAL_PAYLOAD,
			description: 'x'.repeat(19),
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			'Die Beschreibung muss mindestens 20 Zeichen lang sein',
		);
	});

	it('accepts a description of exactly 20 characters', () => {
		const result = feedbackFormSchema.safeParse({
			...MINIMAL_PAYLOAD,
			description: 'x'.repeat(20),
		});

		expect(result.success).toBe(true);
	});

	it('accepts a description of exactly 2000 characters', () => {
		const result = feedbackFormSchema.safeParse({
			...MINIMAL_PAYLOAD,
			description: 'x'.repeat(2000),
		});

		expect(result.success).toBe(true);
	});

	it('rejects a description of 2001 characters', () => {
		const result = feedbackFormSchema.safeParse({
			...MINIMAL_PAYLOAD,
			description: 'x'.repeat(2001),
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			'Die Beschreibung darf maximal 2000 Zeichen lang sein',
		);
	});

	it('accepts a valid email', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, email: 'a@b.com' });

		expect(result.success).toBe(true);
	});

	it('accepts an empty string email', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, email: '' });

		expect(result.success).toBe(true);
	});

	it('rejects an invalid email', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, email: 'not-an-email' });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('Bitte gib eine gültige E-Mail-Adresse ein');
	});

	it('accepts a payload with the email field absent', () => {
		const result = feedbackFormSchema.safeParse(MINIMAL_PAYLOAD);

		expect(result.success).toBe(true);
	});

	it('rejects an unknown browser value', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, browser: 'ie6' });

		expect(result.success).toBe(false);
	});

	it('rejects an unknown operating system value', () => {
		const result = feedbackFormSchema.safeParse({
			...MINIMAL_PAYLOAD,
			operationSystem: 'amiga',
		});

		expect(result.success).toBe(false);
	});

	it('rejects an unknown type value', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, type: 'idea' });

		expect(result.success).toBe(false);
	});

	it('produces the documented message when type is missing', () => {
		const { type: _type, ...withoutType } = MINIMAL_PAYLOAD;

		const result = feedbackFormSchema.safeParse(withoutType);

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('Bitte wähle einen Typ aus');
	});

	it('rejects privacy set to false', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, privacy: false });

		expect(result.success).toBe(false);
	});

	it('accepts an empty screenshotUrls array', () => {
		const result = feedbackFormSchema.safeParse({ ...MINIMAL_PAYLOAD, screenshotUrls: [] });

		expect(result.success).toBe(true);
	});

	it('accepts a populated screenshotUrls array', () => {
		const result = feedbackFormSchema.safeParse({
			...MINIMAL_PAYLOAD,
			screenshotUrls: ['https://example.com/a.png'],
		});

		expect(result.success).toBe(true);
	});

	it('accepts a payload with screenshotUrls absent', () => {
		const result = feedbackFormSchema.safeParse(MINIMAL_PAYLOAD);

		expect(result.success).toBe(true);
	});
});
