import { describe, expect, it } from 'vite-plus/test';

import { baseFieldDefinitions, prepareFieldPreview } from './base';

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
});
