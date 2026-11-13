import { describe, expect, it, vi } from 'vite-plus/test';

import type { NamedImageInput } from '@/components/named-image-input';

import venue from './venue';

// The image field of a venue uses `NamedImageInput`, which pulls in `sanity-plugin-media` and
// breaks under Vitest; see `schemas/objects/meta.test.ts`.
vi.mock(import('@/components/named-image-input'), () => ({
	NamedImageInput: (() => null) as unknown as typeof NamedImageInput,
}));

interface VenueField {
	readonly description?: string;
	readonly fields?: readonly VenueField[];
	readonly hidden?: (context: { document?: Record<string, unknown> }) => boolean;
	readonly name: string;
	readonly of?: readonly { fields?: readonly VenueField[]; name?: string; type: string }[];
	readonly options?: { list?: readonly { title: string; value: string }[] };
	readonly type: string;
	readonly validation?: (rule: unknown) => unknown;
}

const fields = (venue as unknown as { fields: readonly VenueField[] }).fields;

function getField(name: string, from: readonly VenueField[] = fields): VenueField {
	const field = from.find((candidate) => candidate.name === name);

	if (!field) {
		throw new Error(`Expected the venue to declare a "${name}" field.`);
	}

	return field;
}

/**
 * Returns the fields of one row of the opening hours.
 *
 * @returns The fields of the row object.
 */
function getOpeningHoursRowFields(): readonly VenueField[] {
	const rowFields = getField('openingHours').of?.[0]?.fields;

	if (!rowFields) {
		throw new Error('Expected the opening hours to hold row objects with fields.');
	}

	return rowFields;
}

/**
 * Runs the validation of a field against a rule that records the name of every method called on
 * it, so a test can tell whether the field is required.
 *
 * @param field - The field.
 * @returns The names of the called rule methods.
 */
function recordedRuleCalls(field: VenueField): string[] {
	const calls: string[] = [];
	const rule: object = new Proxy(
		{},
		{
			get:
				(_target, property) =>
				(..._args: unknown[]) => {
					calls.push(String(property));
					return rule;
				},
		},
	);
	field.validation?.(rule);

	return calls;
}

describe('venue document', () => {
	it('names its type venue and titles it „Sportstätte“', () => {
		expect(venue).toMatchObject({ name: 'venue', title: 'Sportstätte' });
	});

	it('keeps title, description and type required', () => {
		expect(recordedRuleCalls(getField('title'))).toContain('required');
		expect(recordedRuleCalls(getField('description'))).toContain('required');
		expect(recordedRuleCalls(getField('type'))).toContain('required');
	});

	it('offers the clubhouse as last type', () => {
		expect(getField('type').options?.list?.at(-1)).toStrictEqual({
			title: 'Vereinsheim',
			value: 'clubhouse',
		});
	});

	it('tells the editors that the description appears on the venue page', () => {
		expect(getField('description').description).toContain('Erscheint auf der Sportstättenseite.');
	});

	it('holds the equipment as a list of short texts', () => {
		const features = getField('features');

		expect(features.type).toBe('array');
		expect(features.of?.map(({ type }) => type)).toStrictEqual(['string']);
		expect(recordedRuleCalls(features)).not.toContain('required');
	});

	it('holds the opening hours as rows of required days and time', () => {
		const openingHours = getField('openingHours');

		const rowFields = getOpeningHoursRowFields();
		const days = getField('days', rowFields);
		const time = getField('time', rowFields);

		expect(openingHours.type).toBe('array');
		expect(rowFields.map(({ name, type }) => [name, type])).toStrictEqual([
			['days', 'string'],
			['time', 'string'],
		]);
		expect(recordedRuleCalls(days)).toContain('required');
		expect(recordedRuleCalls(time)).toContain('required');
	});

	it('shows the opening hours only for a clubhouse', () => {
		const { hidden } = getField('openingHours');

		expect(hidden?.({ document: { type: 'cinder' } })).toBe(true);
		expect(hidden?.({ document: {} })).toBe(true);
		expect(hidden?.({ document: { type: 'clubhouse' } })).toBe(false);
	});
});
