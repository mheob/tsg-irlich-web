import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { writeWorkbook } from './write-workbook';

const library = vi.hoisted(() => ({
	toFile: vi.fn(),
	writeExcelFile: vi.fn(),
}));

vi.mock(import('write-excel-file/browser'), () => ({
	default: library.writeExcelFile as never,
}));

describe('write workbook', () => {
	beforeEach(() => {
		library.toFile.mockReset().mockResolvedValue(null);
		library.writeExcelFile.mockReset().mockReturnValue({ toFile: library.toFile });
	});

	it('writes one sheet per export sheet and downloads the file under its name', async () => {
		await writeWorkbook(
			[
				{ name: 'Anmeldungen', rows: [['Nr.'], ['1']] },
				{ name: 'Spieler', rows: [['Name']] },
			],
			'turnier-2027-05-20.xlsx',
		);

		expect(library.writeExcelFile).toHaveBeenCalledExactlyOnceWith([
			{ data: [['Nr.'], ['1']], sheet: 'Anmeldungen' },
			{ data: [['Name']], sheet: 'Spieler' },
		]);
		expect(library.toFile).toHaveBeenCalledExactlyOnceWith('turnier-2027-05-20.xlsx');
	});
});
