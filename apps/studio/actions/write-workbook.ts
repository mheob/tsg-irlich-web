import writeExcelFile from 'write-excel-file/browser';

import type { ExportSheet } from '@tsgi-web/shared';

/**
 * Writes the sheets into an `.xlsx` file and offers it to the browser as a download. Every cell is
 * a string and stays a text cell, so Excel does not turn phone numbers or dates into other types.
 *
 * @param sheets - The sheets to write, the first row of each one is its header.
 * @param fileName - The name of the downloaded file.
 */
async function writeWorkbook(sheets: readonly ExportSheet[], fileName: string): Promise<void> {
	await writeExcelFile(sheets.map((sheet) => ({ data: sheet.rows, sheet: sheet.name }))).toFile(
		fileName,
	);
}

export { writeWorkbook };
