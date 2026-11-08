import { describe, expect, it } from 'vite-plus/test';

import { baseFieldDefinitions, hideInsideGroup, prepareFieldPreview } from './base';
import formFieldEmail from './form-field-email';
import formFieldText from './form-field-text';

interface MarkerField {
	readonly hidden?: unknown;
	readonly name: string;
}

/**
 * Looks a field of a field type up by its name.
 *
 * @param type - The field type.
 * @param name - The name of the field.
 * @returns The field definition.
 */
function getField(type: unknown, name: string): MarkerField {
	const field = (type as { fields: readonly MarkerField[] }).fields.find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected a "${name}" field.`);
	}
	return field;
}

const TOP_LEVEL_PATH = ['fields', { _key: 'team' }, 'isLabel'];
const GROUP_PATH = ['fields', { _key: 'players' }, 'fields', { _key: 'name' }, 'isLabel'];

describe('form field base', () => {
	it('orders the base fields', () => {
		expect(baseFieldDefinitions.map((field) => field.name)).toStrictEqual([
			'label',
			'helpText',
			'isRequired',
			'width',
			'retention',
		]);
	});

	it('previews required fields', () => {
		expect(prepareFieldPreview('Text')({ isRequired: true, label: 'Teamname' })).toStrictEqual({
			subtitle: 'Text · Pflicht',
			title: 'Teamname',
		});
	});

	it('previews optional fields without a label', () => {
		expect(prepareFieldPreview('Text')({})).toStrictEqual({
			subtitle: 'Text',
			title: 'Ohne Bezeichnung',
		});
	});

	it('hides a marker inside a group', () => {
		expect(hideInsideGroup({ path: TOP_LEVEL_PATH })).toBe(false);
		expect(hideInsideGroup({ path: GROUP_PATH })).toBe(true);
	});

	// The website reads both markers from the top-level fields only.
	it('hides the label and the recipient marker inside a group', () => {
		expect(getField(formFieldText, 'isLabel').hidden).toBe(hideInsideGroup);
		expect(getField(formFieldEmail, 'isConfirmationRecipient').hidden).toBe(hideInsideGroup);
	});
});
