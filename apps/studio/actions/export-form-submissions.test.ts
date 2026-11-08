import type { DocumentActionProps } from 'sanity';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { ExportFormSubmissionsAction } from './export-form-submissions';

const studio = vi.hoisted(() => ({
	loadExportData: vi.fn(),
	pushToast: vi.fn(),
	writeWorkbook: vi.fn(),
}));

vi.mock(import('sanity'), () => ({
	useClient: (() => ({})) as never,
}));

vi.mock(import('@sanity/ui/toast'), () => ({
	useToast: (() => ({ push: studio.pushToast })) as never,
}));

vi.mock(import('./load-export-data'), () => ({
	loadExportData: studio.loadExportData as never,
}));

vi.mock(import('./write-workbook'), () => ({
	writeWorkbook: studio.writeWorkbook as never,
}));

function createProps(documents: Partial<DocumentActionProps>): DocumentActionProps {
	return {
		draft: null,
		id: 'form-1',
		published: { _id: 'form-1' },
		type: 'form',
		...documents,
	} as DocumentActionProps;
}

const submission = {
	_id: 'form.submission.1',
	answers: [],
	label: 'Muster',
	status: 'registered',
	submittedAt: '2027-05-01T10:00:00Z',
};

async function click(props: DocumentActionProps): Promise<void> {
	const onHandle = ExportFormSubmissionsAction(props).onHandle as () => Promise<void>;
	await onHandle();
}

describe('export form submissions action', () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date('2027-05-20T10:00:00Z'), toFake: ['Date'] });
		studio.loadExportData.mockReset().mockResolvedValue({
			fields: [{ _key: 'f1', _type: 'formFieldText', label: 'Name' }],
			slug: 'dorfturnier-2027',
			submissions: [submission],
		});
		studio.pushToast.mockReset();
		studio.writeWorkbook.mockReset().mockResolvedValue(null);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('is disabled before the first publish', () => {
		const action = ExportFormSubmissionsAction(createProps({ published: null }));

		expect(action).toMatchObject({
			disabled: true,
			label: 'Als Excel exportieren',
			title: 'Erst veröffentlichen',
		});
	});

	it('writes the workbook named after slug and date', async () => {
		await click(createProps({}));

		expect(studio.loadExportData).toHaveBeenCalledWith(expect.anything(), 'form-1');
		const sheets: unknown = expect.any(Array);

		expect(studio.writeWorkbook).toHaveBeenCalledExactlyOnceWith(
			sheets,
			'dorfturnier-2027-2027-05-20.xlsx',
		);
		expect(studio.pushToast).not.toHaveBeenCalled();
	});

	it('uses the Berlin date near midnight', async () => {
		vi.setSystemTime(new Date('2027-05-20T22:30:00Z'));

		await click(createProps({}));

		expect(studio.writeWorkbook).toHaveBeenCalledWith(
			expect.anything(),
			'dorfturnier-2027-2027-05-21.xlsx',
		);
	});

	it('toasts when there are no submissions', async () => {
		studio.loadExportData.mockResolvedValue({ fields: [], slug: 'x', submissions: [] });

		await click(createProps({}));

		expect(studio.writeWorkbook).not.toHaveBeenCalled();
		expect(studio.pushToast).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ status: 'info', title: 'Noch keine Eingänge' }),
		);
	});

	it('toasts when loading fails', async () => {
		vi.spyOn(console, 'error').mockReturnValue();
		studio.loadExportData.mockRejectedValue(new Error('offline'));

		await click(createProps({}));

		expect(studio.pushToast).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ status: 'error', title: 'Export fehlgeschlagen' }),
		);
	});

	it('toasts when writing fails', async () => {
		vi.spyOn(console, 'error').mockReturnValue();
		studio.writeWorkbook.mockRejectedValue(new Error('disk'));

		await click(createProps({}));

		expect(studio.pushToast).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ status: 'error', title: 'Export fehlgeschlagen' }),
		);
	});

	it('ignores a second click while the export runs', async () => {
		const action = ExportFormSubmissionsAction(createProps({}));
		const onHandle = action.onHandle as () => Promise<void>;

		await Promise.all([onHandle(), onHandle()]);

		expect(studio.writeWorkbook).toHaveBeenCalledOnce();
	});
});
