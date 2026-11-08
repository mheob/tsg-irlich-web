import { z } from 'zod';

import { getAgeOn } from './age';
import { formatShortDate } from './format';
import type { AnyFormField, FormFieldDefinition, FormValues } from './types';

const NOTE_TYPE = 'formFieldNote';
const REQUIRED_MESSAGE = 'Bitte fülle dieses Feld aus.';
const EMAIL_MESSAGE = 'Bitte gib eine gültige E-Mail-Adresse ein.';
const PHONE_MESSAGE = 'Bitte gib eine gültige Telefonnummer ein.';
const INTEGER_MESSAGE = 'Bitte gib eine ganze Zahl ein.';
const DATE_MESSAGE = 'Bitte gib ein gültiges Datum ein.';
const CHOICE_MESSAGE = 'Bitte wähle eine Option.';
const MULTIPLE_CHOICE_MESSAGE = 'Bitte wähle mindestens eine Option.';
const CONSENT_MESSAGE = 'Bitte bestätige dies, um fortzufahren.';

const PHONE_PATTERN = /^\+?[\d\s/()-]{6,20}$/u;
const INTEGER_PATTERN = /^-?\d+$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const emailSchema = z.email();

/** Caps for inputs the editor left unbounded, so nothing unlimited reaches Sanity or a mail. */
const DEFAULT_TEXT_MAX_LENGTH = 500;
const DEFAULT_TEXTAREA_MAX_LENGTH = 5000;
const EMAIL_MAX_LENGTH = 254;
const NUMBER_MAX_LENGTH = 15;
const DEFAULT_GROUP_MAX_ITEMS = 100;

/**
 * Whether a `YYYY-MM-DD` string names a day that exists, so `2027-02-30` fails.
 *
 * @param value - The string to check.
 * @returns `true` for a real calendar date.
 */
function isCalendarDate(value: string): boolean {
	if (!DATE_PATTERN.test(value)) {
		return false;
	}
	const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
	);
}

/**
 * A string input that may stay empty unless the field is required; the check only runs on a value.
 *
 * @param field - The field definition.
 * @param isValid - Decides whether a non-empty, trimmed value is acceptable.
 * @param message - The message for a rejected value.
 * @returns The schema for the trimmed string.
 */
function checkedString(
	field: AnyFormField,
	isValid: (value: string) => boolean,
	message: string,
): z.ZodType {
	return z
		.string()
		.trim()
		.refine((value) => (value === '' ? !field.isRequired : isValid(value)), { error: message });
}

function buildTextSchema(field: AnyFormField): z.ZodType {
	const maxLength =
		field.maxLength ??
		(field._type === 'formFieldTextarea' ? DEFAULT_TEXTAREA_MAX_LENGTH : DEFAULT_TEXT_MAX_LENGTH);
	let schema = z.string().trim();
	if (field.isRequired) {
		schema = schema.min(1, { error: REQUIRED_MESSAGE });
	}
	return schema.max(maxLength, { error: `Bitte höchstens ${maxLength} Zeichen eingeben.` });
}

function buildNumberSchema(field: AnyFormField): z.ZodType {
	const { max, min } = field;
	return z
		.string()
		.trim()
		.superRefine((value, context) => {
			if (value === '') {
				if (field.isRequired) {
					context.addIssue({ code: 'custom', message: INTEGER_MESSAGE });
				}
				return;
			}
			if (value.length > NUMBER_MAX_LENGTH || !INTEGER_PATTERN.test(value)) {
				context.addIssue({ code: 'custom', message: INTEGER_MESSAGE });
			} else if (typeof min === 'number' && Number(value) < min) {
				context.addIssue({ code: 'custom', message: `Bitte mindestens ${min} eingeben.` });
			} else if (typeof max === 'number' && Number(value) > max) {
				context.addIssue({ code: 'custom', message: `Bitte höchstens ${max} eingeben.` });
			}
		});
}

function buildDateSchema(field: AnyFormField): z.ZodType {
	const { minAge, referenceDate } = field;
	return z
		.string()
		.trim()
		.superRefine((value, context) => {
			if (value === '' ? field.isRequired : !isCalendarDate(value)) {
				context.addIssue({ code: 'custom', message: DATE_MESSAGE });
			} else if (
				value !== '' &&
				minAge &&
				referenceDate &&
				getAgeOn(value, referenceDate) < minAge
			) {
				context.addIssue({
					code: 'custom',
					message: `Das Mindestalter ist ${minAge} Jahre am ${formatShortDate(referenceDate)}.`,
				});
			}
		});
}

function buildChoiceSchema(field: AnyFormField): z.ZodType {
	const options = field.options ?? [];
	if (field.isMultiple) {
		return z
			.array(z.string().refine((value) => options.includes(value), { error: CHOICE_MESSAGE }))
			.min(field.isRequired ? 1 : 0, { error: MULTIPLE_CHOICE_MESSAGE })
			.refine(
				(values) => values.length <= options.length && new Set(values).size === values.length,
				{
					error: CHOICE_MESSAGE,
				},
			);
	}
	return z
		.string()
		.refine((value) => (value === '' ? !field.isRequired : options.includes(value)), {
			error: CHOICE_MESSAGE,
		});
}

// A consent is always mandatory: items created through the API or an import carry no `isRequired`.
function buildConsentSchema(): z.ZodType {
	return z.boolean().refine((value) => value, { error: CONSENT_MESSAGE });
}

/**
 * The fields of a group. The types say a group always has some, which holds for a published form;
 * a draft in the preview skips the Studio's required checks and may have none yet.
 *
 * @param field - The group.
 * @param field.fields - Its fields, if it has any.
 * @returns The fields, an empty list while there are none.
 */
function getGroupFields(field: {
	fields?: readonly AnyFormField[] | null;
}): readonly AnyFormField[] {
	return field.fields ?? [];
}

function buildGroupSchema(
	field: Extract<FormFieldDefinition, { _type: 'formFieldGroup' }>,
): z.ZodType {
	const { itemLabel } = field;
	const minItems = field.minItems ?? (field.isRequired ? 1 : 0);
	// buildShape and buildGroupSchema call each other, so one is used before its definition.
	// oxlint-disable-next-line no-use-before-define
	const entryShape = buildShape(getGroupFields(field));
	const schema = z
		.array(z.object(entryShape))
		.min(minItems, { error: `Bitte mindestens ${minItems} Einträge „${itemLabel}“ angeben.` });
	const maxItems = field.maxItems ?? DEFAULT_GROUP_MAX_ITEMS;
	return schema.max(maxItems, {
		error: `Bitte höchstens ${maxItems} Einträge „${itemLabel}“ angeben.`,
	});
}

const SCHEMA_BUILDERS: Partial<Record<string, (field: AnyFormField) => z.ZodType>> = {
	formFieldChoice: buildChoiceSchema,
	formFieldConsent: buildConsentSchema,
	formFieldDate: buildDateSchema,
	formFieldEmail: (field) =>
		checkedString(
			field,
			(value) => value.length <= EMAIL_MAX_LENGTH && emailSchema.safeParse(value).success,
			EMAIL_MESSAGE,
		),
	formFieldNumber: buildNumberSchema,
	formFieldPhone: (field) =>
		checkedString(field, (value) => PHONE_PATTERN.test(value), PHONE_MESSAGE),
	formFieldText: buildTextSchema,
	formFieldTextarea: buildTextSchema,
};

// The schema of one field, or `null` for a type that takes no value, such as a note.
function buildFieldSchema(field: AnyFormField): z.ZodType | null {
	if (field._type === 'formFieldGroup') {
		return buildGroupSchema(field);
	}
	return SCHEMA_BUILDERS[field._type]?.(field) ?? null;
}

function buildShape(fields: readonly AnyFormField[]): Record<string, z.ZodType> {
	const shape: Record<string, z.ZodType> = {};
	for (const field of fields) {
		const schema = buildFieldSchema(field);
		if (schema) {
			shape[field._key] = schema;
		}
	}
	return shape;
}

/**
 * Builds the validation schema of a form from its field definitions at runtime. Every field is
 * keyed by its `_key`, notes are skipped, and a group validates an array of objects of its
 * sub-fields. Values arrive as strings from inputs, so numbers are checked as strings and stay
 * strings.
 *
 * @param fields - The fields of the form as the queries project them.
 * @returns The schema of the whole form.
 */
function buildFormSchema(
	fields: readonly FormFieldDefinition[],
): z.ZodObject<Record<string, z.ZodType>> {
	return z.object(buildShape(fields));
}

function getFieldDefault(field: AnyFormField): unknown {
	if (field._type === 'formFieldGroup') {
		// oxlint-disable-next-line no-use-before-define
		return field.isRequired ? [getDefaultValues(getGroupFields(field))] : [];
	}
	if (field._type === 'formFieldConsent') {
		return false;
	}
	if (field._type === 'formFieldChoice' && field.isMultiple) {
		return [];
	}
	return '';
}

/**
 * The initial values of the form: an empty string for text-like fields and single choices, `[]`
 * for multiple choices, `false` for consent, and for a group one entry of sub-field defaults when
 * it is required, otherwise no entry.
 *
 * @param fields - The fields of the form, or of a group.
 * @returns The values keyed by `_key`; notes have none.
 */
function getDefaultValues(fields: readonly AnyFormField[]): FormValues {
	const values: FormValues = {};
	for (const field of fields) {
		if (field._type !== NOTE_TYPE) {
			values[field._key] = getFieldDefault(field);
		}
	}
	return values;
}

export { buildFormSchema, getDefaultValues };
