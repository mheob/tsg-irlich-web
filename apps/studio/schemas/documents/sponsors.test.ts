import { describe, expect, it } from 'vite-plus/test';

import sponsors from './sponsors';

interface RecordedCall {
	readonly args: readonly unknown[];
	readonly name: string;
}

interface ValidatedField {
	readonly description?: string;
	readonly name: string;
	readonly validation?: (rule: unknown) => unknown;
}

/**
 * Looks up a field of the sponsor document.
 *
 * @param name - The name of the field.
 * @returns The field definition.
 */
function field(name: string): ValidatedField {
	const found = (sponsors.fields as readonly ValidatedField[]).find(
		(candidate) => candidate.name === name,
	);
	if (!found) {
		throw new Error(`Expected the sponsor to have a "${name}" field.`);
	}
	return found;
}

/**
 * Runs the validation of a field against a rule that only writes down the calls it receives, with
 * their arguments, which is all a builder chain leaves to look at.
 *
 * @param target - The field to validate.
 * @returns The calls of every chain, in order.
 */
function recordedCalls(target: ValidatedField): RecordedCall[] {
	const calls: RecordedCall[] = [];
	const rule: unknown = new Proxy(
		{},
		{
			get:
				(_target, name) =>
				(...args: unknown[]) => {
					calls.push({ args, name: String(name) });
					return rule;
				},
		},
	);
	target.validation?.(rule);
	return calls;
}

describe('sponsors document', () => {
	it('lets a sponsor go without a website', () => {
		expect(recordedCalls(field('website')).map((call) => call.name)).not.toContain('required');
	});

	it('still only accepts http and https addresses', () => {
		expect(recordedCalls(field('website'))).toContainEqual({
			args: [{ scheme: ['http', 'https'] }],
			name: 'uri',
		});
	});

	it('says what happens without a website', () => {
		expect(field('website').description).toBe(
			'Die Website des Sponsors. Ohne Website erscheint das Logo ohne Link.',
		);
	});
});
