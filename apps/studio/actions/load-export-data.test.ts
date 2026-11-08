import { describe, expect, it, vi } from 'vite-plus/test';

import type { ExportSubmission, FormFieldShape } from '@tsgi-web/shared';

import { loadExportData } from './load-export-data';

const fields: FormFieldShape[] = [{ _key: 'f1', _type: 'formFieldText', label: 'Name' }];

const submissions: ExportSubmission[] = [
	{
		_id: 'form.submission.1',
		answers: [],
		label: 'Muster',
		status: 'registered',
		submittedAt: '2027-05-01T10:00:00Z',
	},
];

describe('load export data', () => {
	it('passes the form id and maps the result', async () => {
		const fetch = vi.fn().mockResolvedValue({
			form: { fields, slug: 'dorfturnier-2027' },
			submissions,
		});

		const data = await loadExportData({ fetch }, 'form-1');

		expect(fetch).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('form.submission'), {
			id: 'form-1',
		});
		expect(data).toStrictEqual({ fields, slug: 'dorfturnier-2027', submissions });
	});

	it('returns empty submissions when none exist', async () => {
		const fetch = vi.fn().mockResolvedValue({
			form: { fields: null, slug: null },
			submissions: [],
		});

		const data = await loadExportData({ fetch }, 'form-1');

		expect(data).toStrictEqual({ fields: [], slug: 'formular', submissions: [] });
	});
});
