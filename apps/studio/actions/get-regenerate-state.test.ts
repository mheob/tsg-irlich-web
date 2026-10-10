import { describe, expect, it } from 'vite-plus/test';

import { getRegenerateState } from './get-regenerate-state';

describe('regenerate echo pages state', () => {
	it('is disabled without a document', () => {
		expect(getRegenerateState(null)).toStrictEqual({
			disabled: true,
			title: 'Zuerst eine PDF hochladen',
		});
	});

	it('is disabled while no PDF is set', () => {
		expect(getRegenerateState({ title: 'TSG ECHO 2025' }).disabled).toBe(true);
	});

	it('is enabled once a PDF is set', () => {
		expect(getRegenerateState({ pdf: { asset: { _ref: 'file-abc-pdf' } } })).toStrictEqual({
			disabled: false,
			title: 'Erzeugt die Seiten zum Durchblättern erneut aus der PDF',
		});
	});
});
