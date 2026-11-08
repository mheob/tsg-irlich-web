import { GROUP_FIELD_TYPE, NOTE_FIELD_TYPE } from '@tsgi-web/shared';
import type { FieldRetention, FormAnswer, FormGroupAnswer, FormGroupEntry } from '@tsgi-web/shared';

import type { AnyFormField, FormFieldDefinition, FormValues } from './types';

type CreateKey = () => string;

interface StoredValue {
	value?: string | null;
	values?: string[];
}

function toText(value: unknown): string | null {
	const text = typeof value === 'string' ? value.trim() : '';
	return text === '' ? null : text;
}

function toRetention(field: AnyFormField): { retention?: FieldRetention } {
	return field.retention === 'delete' || field.retention === 'year'
		? { retention: field.retention }
		: {};
}

function toStoredValue(field: AnyFormField, value: unknown): StoredValue {
	if (field._type === 'formFieldConsent') {
		return { value: value === true ? 'ja' : null };
	}
	if (field._type === 'formFieldChoice' && field.isMultiple) {
		const values = Array.isArray(value)
			? value.filter((item): item is string => typeof item === 'string')
			: [];
		return values.length > 0 ? { values } : { value: null };
	}
	return { value: toText(value) };
}

function toGroupAnswer(field: AnyFormField, value: unknown, createKey: CreateKey): FormGroupAnswer {
	return {
		_key: createKey(),
		_type: 'formGroupAnswer',
		fieldType: field._type,
		key: field._key,
		label: field.label ?? '',
		...toRetention(field),
		...toStoredValue(field, value),
	};
}

function toGroupEntries(
	fields: readonly AnyFormField[],
	value: unknown,
	createKey: CreateKey,
): FormGroupEntry[] {
	const rows = Array.isArray(value) ? value : [];
	return rows.map((row: unknown) => {
		const entry: FormValues = typeof row === 'object' && row !== null ? { ...row } : {};
		return {
			_key: createKey(),
			_type: 'formGroupEntry',
			answers: fields
				.filter((field) => field._type !== NOTE_FIELD_TYPE)
				.map((field) => toGroupAnswer(field, entry[field._key], createKey)),
		};
	});
}

function toAnswer(
	field: FormFieldDefinition,
	values: FormValues,
	createKey: CreateKey,
): FormAnswer {
	const answer: FormAnswer = {
		_key: createKey(),
		_type: 'formAnswer',
		fieldType: field._type,
		key: field._key,
		label: field.label ?? '',
		...toRetention(field),
	};
	if (field._type === GROUP_FIELD_TYPE) {
		answer.entries = toGroupEntries(field.fields, values[field._key], createKey);
	} else {
		Object.assign(answer, toStoredValue(field, values[field._key]));
	}
	return answer;
}

/**
 * Turns the values of a submitted form into the answers Sanity stores. Notes are skipped, an empty
 * value becomes `null`, a multiple choice becomes `values`, consent becomes `ja`, and a group
 * becomes `entries`. `retention` is copied only for `delete` and `year`.
 *
 * @param fields - The fields of the form.
 * @param values - The validated values keyed by `_key`.
 * @param createKey - Makes the `_key` of every array item.
 * @returns One answer per field except notes, in the order of the fields.
 */
function toAnswers(
	fields: readonly FormFieldDefinition[],
	values: FormValues,
	createKey: CreateKey = () => crypto.randomUUID(),
): FormAnswer[] {
	return fields
		.filter((field) => field._type !== NOTE_FIELD_TYPE)
		.map((field) => toAnswer(field, values, createKey));
}

/**
 * The value of the field marked `isLabel`, which names a submission in the studio and the export.
 *
 * @param fields - The fields of the form.
 * @param values - The submitted values keyed by `_key`.
 * @returns The trimmed value, or `null` when no field is marked or it is empty.
 */
function getSubmissionLabel(
	fields: readonly FormFieldDefinition[],
	values: FormValues,
): string | null {
	const field = fields.find((candidate) => candidate.isLabel);
	return field ? toText(values[field._key]) : null;
}

/**
 * The address the confirmation goes to: the value of the email field marked as its recipient.
 *
 * @param fields - The fields of the form.
 * @param values - The submitted values keyed by `_key`.
 * @returns The trimmed address, or `null` when no field is marked or it is empty.
 */
function getConfirmationRecipient(
	fields: readonly FormFieldDefinition[],
	values: FormValues,
): string | null {
	const field = fields.find((candidate) => candidate.isConfirmationRecipient);
	return field ? toText(values[field._key]) : null;
}

export { getConfirmationRecipient, getSubmissionLabel, toAnswers };
