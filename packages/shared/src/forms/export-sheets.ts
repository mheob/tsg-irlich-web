import { GROUP_FIELD_TYPE, NOTE_FIELD_TYPE, SUBMISSION_STATUS_LABELS } from './default-texts';
import type {
	ExportSheet,
	ExportSubmission,
	FormAnswer,
	FormFieldShape,
	FormGroupAnswer,
} from './types';

const MAX_SHEET_NAME_LENGTH = 31;
const MAIN_SHEET_NAME = 'Anmeldungen';
const FALLBACK_SHEET_NAME = 'Tabelle';
const INVALID_SHEET_CHARACTERS = /[[\]:*?/\\]/gu;

const dateFormat = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	month: '2-digit',
	timeZone: 'Europe/Berlin',
	year: 'numeric',
});

interface Column {
	key: string;
	label: string;
}

function formatDate(iso: string): string {
	return dateFormat.format(new Date(iso)).replace(',', '');
}

function cellValue(answer: FormAnswer | FormGroupAnswer | undefined): string {
	return answer?.value ?? answer?.values?.join(', ') ?? '';
}

function isColumnField(field: FormFieldShape): boolean {
	return field._type !== GROUP_FIELD_TYPE && field._type !== NOTE_FIELD_TYPE;
}

/**
 * Adds a column for every answer key that the defined fields do not cover.
 *
 * @param columns - The columns of the defined fields.
 * @param answers - The answers to scan for unknown keys.
 * @returns The defined columns followed by one column per unknown key.
 */
function withOrphans(
	columns: Column[],
	answers: readonly (FormAnswer | FormGroupAnswer)[],
): Column[] {
	const result = [...columns];

	for (const answer of answers) {
		if (!result.some((column) => column.key === answer.key)) {
			result.push({ key: answer.key, label: answer.label });
		}
	}

	return result;
}

function toColumns(fields: readonly FormFieldShape[]): Column[] {
	return fields
		.filter((field) => isColumnField(field))
		.map((field) => ({ key: field._key, label: field.label ?? '' }));
}

function findAnswer<T extends FormAnswer | FormGroupAnswer>(
	answers: readonly T[],
	key: string,
): T | undefined {
	return answers.find((answer) => answer.key === key);
}

function entryRow(
	prefix: readonly string[],
	answers: readonly FormGroupAnswer[],
	columns: readonly Column[],
): string[] {
	return [...prefix, ...columns.map((column) => cellValue(findAnswer(answers, column.key)))];
}

function uniqueSheetName(label: string, taken: Set<string>): string {
	const base =
		label.replaceAll(INVALID_SHEET_CHARACTERS, '').trim().slice(0, MAX_SHEET_NAME_LENGTH).trim() ||
		FALLBACK_SHEET_NAME;
	let name = base;
	let counter = 2;

	while (taken.has(name.toLowerCase())) {
		const suffix = ` (${counter})`;
		name = `${base.slice(0, MAX_SHEET_NAME_LENGTH - suffix.length)}${suffix}`;
		counter += 1;
	}

	taken.add(name.toLowerCase());
	return name;
}

/**
 * Lays out the submissions of a form for a spreadsheet export: one main sheet with a row per
 * submission and one sheet per group field with a row per entry. Answers whose field no longer
 * exists get their own trailing column.
 *
 * @param fields - The current fields of the form.
 * @param submissions - The submissions to export, in any order.
 * @returns The sheets, the main sheet first.
 */
function buildExportSheets(
	fields: readonly FormFieldShape[],
	submissions: readonly ExportSubmission[],
): ExportSheet[] {
	const sorted = submissions.toSorted((a, b) => a.submittedAt.localeCompare(b.submittedAt));
	const numbered = sorted.map((submission, index) => ({ number: index + 1, submission }));
	const taken = new Set([MAIN_SHEET_NAME.toLowerCase()]);

	const mainColumns = withOrphans(
		toColumns(fields),
		sorted.flatMap((submission) => submission.answers.filter((answer) => !answer.entries)),
	);
	const mainSheet: ExportSheet = {
		name: MAIN_SHEET_NAME,
		rows: [
			['Nr.', 'Eingang', 'Status', ...mainColumns.map((column) => column.label)],
			...numbered.map(({ number, submission }) => [
				String(number),
				formatDate(submission.submittedAt),
				SUBMISSION_STATUS_LABELS[submission.status],
				...mainColumns.map((column) => cellValue(findAnswer(submission.answers, column.key))),
			]),
		],
	};

	if (sorted.length === 0) {
		return [mainSheet];
	}

	const groupSheets = fields
		.filter((field) => field._type === GROUP_FIELD_TYPE)
		.map((group): ExportSheet => {
			const entries = numbered.flatMap(({ number, submission }) =>
				(findAnswer(submission.answers, group._key)?.entries ?? []).map((entry) => ({
					entry,
					number,
					submission,
				})),
			);
			const columns = withOrphans(
				toColumns(group.fields ?? []),
				entries.flatMap(({ entry }) => entry.answers),
			);

			return {
				name: uniqueSheetName(group.label ?? '', taken),
				rows: [
					['Nr.', 'Bezeichnung', ...columns.map((column) => column.label)],
					...entries.map(({ entry, number, submission }) =>
						entryRow([String(number), submission.label ?? ''], entry.answers, columns),
					),
				],
			};
		});

	return [mainSheet, ...groupSheets];
}

export { buildExportSheets };
