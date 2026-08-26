import { describe, expect, it } from 'vitest';

import { contactFormSchema, contactFormWithReceiverSchema } from '@/lib/validations/contact-form';

const VALID_PAYLOAD = {
	email: 'test@example.com',
	message: 'x'.repeat(32),
	name: 'Al',
	privacy: true,
};

const VALID_RECEIVER = { email: 'receiver@example.com', label: 'Vorstand' };

describe('the base contact form schema', () => {
	it('parses a complete valid payload without a receiver', () => {
		const result = contactFormSchema.safeParse(VALID_PAYLOAD);

		expect(result.success).toBe(true);
	});

	it('parses a complete valid payload with a receiver', () => {
		const result = contactFormSchema.safeParse({ ...VALID_PAYLOAD, receiver: VALID_RECEIVER });

		expect(result.success).toBe(true);
	});

	it('rejects an invalid email', () => {
		const result = contactFormSchema.safeParse({ ...VALID_PAYLOAD, email: 'not-an-email' });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('Die E-Mail Adresse ist ungültig.');
	});

	it('rejects a message of 31 characters', () => {
		const result = contactFormSchema.safeParse({ ...VALID_PAYLOAD, message: 'x'.repeat(31) });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			'Die Nachricht muss mindestens 32 Zeichen lang sein.',
		);
	});

	it('accepts a message of exactly 32 characters', () => {
		const result = contactFormSchema.safeParse({ ...VALID_PAYLOAD, message: 'x'.repeat(32) });

		expect(result.success).toBe(true);
	});

	it('rejects a name of 1 character', () => {
		const result = contactFormSchema.safeParse({ ...VALID_PAYLOAD, name: 'A' });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('Der Name muss mindestens 2 Zeichen lang sein.');
	});

	it('accepts a name of exactly 2 characters', () => {
		const result = contactFormSchema.safeParse({ ...VALID_PAYLOAD, name: 'AB' });

		expect(result.success).toBe(true);
	});

	it('rejects privacy set to false', () => {
		const result = contactFormSchema.safeParse({ ...VALID_PAYLOAD, privacy: false });

		expect(result.success).toBe(false);
	});

	it('accepts privacy set to true', () => {
		const result = contactFormSchema.safeParse({ ...VALID_PAYLOAD, privacy: true });

		expect(result.success).toBe(true);
	});

	it('rejects a receiver with a bad email with the receiver message', () => {
		const result = contactFormSchema.safeParse({
			...VALID_PAYLOAD,
			receiver: { email: 'not-an-email', label: 'Vorstand' },
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('Kein Empfänger ausgewählt.');
	});
});

describe('the difference between the base and receiver-required schemas', () => {
	it('rejects a missing receiver only when the receiver is required', () => {
		const withoutReceiver = contactFormSchema.safeParse(VALID_PAYLOAD);
		const withoutReceiverButRequired = contactFormWithReceiverSchema.safeParse(VALID_PAYLOAD);
		const withReceiverAndRequired = contactFormWithReceiverSchema.safeParse({
			...VALID_PAYLOAD,
			receiver: VALID_RECEIVER,
		});

		expect(withoutReceiver.success).toBe(true);
		expect(withoutReceiverButRequired.success).toBe(false);
		expect(withReceiverAndRequired.success).toBe(true);
	});
});
