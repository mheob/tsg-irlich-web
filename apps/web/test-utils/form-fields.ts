import type { FormFieldDefinition } from '@/lib/forms/types';

type FieldOverrides = Record<string, unknown>;

/**
 * Builds a field the way the query projects it: every attribute present, `null` where the type
 * has none. The cast is the price of keeping fixtures short.
 *
 * @param type - The `_type` of the field.
 * @param key - The `_key` of the field.
 * @param label - The label.
 * @param overrides - Attributes that differ from an optional, full-width field.
 * @returns The field as `formByIdQuery` would return it.
 */
// oxlint-disable-next-line max-params -- a fixture helper reads best as (type, key, label, overrides)
function field(
	type: string,
	key: string,
	label: string,
	overrides: FieldOverrides = {},
): FormFieldDefinition {
	return {
		_key: key,
		_type: type,
		display: null,
		fields: null,
		helpText: null,
		isConfirmationRecipient: null,
		isLabel: null,
		isMultiple: null,
		isRequired: false,
		itemLabel: null,
		label,
		max: null,
		maxItems: null,
		maxLength: null,
		min: null,
		minAge: null,
		minItems: null,
		options: null,
		referenceDate: null,
		retention: 'keep',
		text: null,
		title: null,
		width: 'full',
		...overrides,
	} as unknown as FormFieldDefinition;
}

/** The Dorfturnier registration from the spec. */
const DORFTURNIER_FIELDS: readonly FormFieldDefinition[] = [
	field('formFieldText', 'team', 'Teamname', { isLabel: true, isRequired: true, maxLength: 40 }),
	field('formFieldNote', 'note', 'Hinweis', { title: 'Spielerliste' }),
	field('formFieldEmail', 'mail', 'E-Mail', { isConfirmationRecipient: true, isRequired: true }),
	field('formFieldPhone', 'phone', 'Telefon', { isRequired: true }),
	field('formFieldNumber', 'age', 'Alter', { max: 99, min: 5 }),
	field('formFieldChoice', 'cat', 'Kategorie', {
		display: 'buttons',
		isRequired: true,
		options: ['Hobby', 'Aktive'],
	}),
	field('formFieldChoice', 'food', 'Essen', {
		isMultiple: true,
		options: ['Bratwurst', 'Pommes', 'Salat'],
	}),
	field('formFieldConsent', 'privacy', 'Datenschutz', { isRequired: true, retention: null }),
	field('formFieldText', 'remark', 'Anmerkung', { maxLength: 10 }),
	field('formFieldGroup', 'players', 'Spieler', {
		fields: [
			field('formFieldText', 'name', 'Name', { isRequired: true }),
			field('formFieldDate', 'birth', 'Geburtsdatum', {
				isRequired: true,
				minAge: 16,
				referenceDate: '2027-05-14',
				retention: 'year',
			}),
			field('formFieldText', 'secret', 'Geheim', { retention: 'delete' }),
		],
		isRequired: true,
		itemLabel: 'Spieler',
		minItems: 6,
		maxItems: 8,
	}),
];

export { DORFTURNIER_FIELDS, field };
