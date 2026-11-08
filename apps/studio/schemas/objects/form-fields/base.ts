import { defineField, type FieldDefinition } from 'sanity';

type RetentionValue = 'delete' | 'keep' | 'year';

interface RetentionOption {
	readonly title: string;
	readonly value: RetentionValue;
}

const KEEP_OPTION: RetentionOption = { title: 'behalten', value: 'keep' };
const YEAR_OPTION: RetentionOption = { title: 'auf das Jahr kürzen', value: 'year' };
const DELETE_OPTION: RetentionOption = { title: 'löschen', value: 'delete' };

interface BaseFieldOptions {
	/** Names of base fields the editor must not see; they keep their initial value. */
	readonly hidden?: readonly string[];
	/** Initial value of `isRequired`. */
	readonly isRequiredByDefault?: boolean;
	/** Whether the retention list also offers `year`. */
	readonly offersYearRetention?: boolean;
}

/**
 * The fields every form field type shares, except the note.
 *
 * @param options - Hides fields or widens the retention list for a type.
 * @param options.hidden - Names of base fields to hide.
 * @param options.isRequiredByDefault - Initial value of `isRequired`.
 * @param options.offersYearRetention - Whether retention offers `year`.
 * @returns The five base fields: label, helpText, isRequired, width, retention.
 */
function createBaseFields({
	hidden = [],
	isRequiredByDefault = false,
	offersYearRetention = false,
}: BaseFieldOptions = {}): FieldDefinition[] {
	return [
		defineField({
			name: 'label',
			title: 'Bezeichnung',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'helpText',
			rows: 2,
			title: 'Hilfetext',
			type: 'text',
		}),
		defineField({
			hidden: hidden.includes('isRequired'),
			initialValue: isRequiredByDefault,
			name: 'isRequired',
			title: 'Pflichtfeld',
			type: 'boolean',
		}),
		defineField({
			initialValue: 'full',
			name: 'width',
			options: {
				layout: 'radio',
				list: [
					{ title: 'ganze Breite', value: 'full' },
					{ title: 'halbe Breite', value: 'half' },
				],
			},
			title: 'Breite',
			type: 'string',
		}),
		defineField({
			hidden: hidden.includes('retention'),
			initialValue: 'keep',
			name: 'retention',
			options: {
				layout: 'radio',
				list: offersYearRetention
					? [KEEP_OPTION, YEAR_OPTION, DELETE_OPTION]
					: [KEEP_OPTION, DELETE_OPTION],
			},
			title: 'Nach der Veranstaltung',
			type: 'string',
		}),
	];
}

const baseFieldDefinitions = createBaseFields();

interface FieldPreviewSelection {
	readonly isRequired?: boolean;
	readonly label?: string;
}

/**
 * Builds the `prepare` function of a field type's preview.
 *
 * @param typeTitle - The German name of the type, shown as the subtitle.
 * @returns A `prepare` function that titles the row with the label.
 */
function prepareFieldPreview(
	typeTitle: string,
): (selection: FieldPreviewSelection) => { subtitle: string; title: string } {
	return ({ isRequired, label }) => ({
		subtitle: `${typeTitle}${isRequired ? ' · Pflicht' : ''}`,
		title: label ?? 'Ohne Bezeichnung',
	});
}

/**
 * Reads a sibling value of the field being validated or hidden.
 *
 * @param context - A validation or `hidden` context carrying the `parent` object.
 * @param key - The name of the sibling field.
 * @returns The sibling's value, or `undefined` without a parent.
 */
function readParentValue(context: { readonly parent?: unknown }, key: string): unknown {
	const { parent } = context;
	return typeof parent === 'object' && parent !== null ? Reflect.get(parent, key) : undefined;
}

export { baseFieldDefinitions, createBaseFields, prepareFieldPreview, readParentValue };
