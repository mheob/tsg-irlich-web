import type { FormFieldDefinition } from '@/lib/forms/types';

type FieldOverrides = Record<string, unknown>;

/** A part of a paragraph: plain text, or text that links to `href`. */
type TextPart = string | { href: string; text: string };

/**
 * Builds a `simpleBlockContent` value the way the form queries project it, as the `text` of a
 * consent or a note: one paragraph made of the given parts.
 *
 * @param parts - The pieces of the paragraph, in order.
 * @returns The block content with every link as a `link` mark.
 */
function blockText(...parts: readonly TextPart[]): Record<string, unknown> {
	const markDefs: Record<string, string>[] = [];
	const children = parts.map((part, index) => {
		if (typeof part === 'string') {
			return { _key: `span-${index}`, _type: 'span', marks: [], text: part };
		}
		markDefs.push({ _key: `link-${index}`, _type: 'link', href: part.href });
		return { _key: `span-${index}`, _type: 'span', marks: [`link-${index}`], text: part.text };
	});
	return {
		_type: 'simpleBlockContent',
		text: [{ _key: 'block-0', _type: 'block', children, markDefs, style: 'normal' }],
	};
}

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

export { blockText, DORFTURNIER_FIELDS, field };
