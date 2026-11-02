// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

import { OCR_ARGS, createOcrTools } from './ocrmypdf';
import type { OcrToolDeps } from './ocrmypdf';

const LANGUAGES =
	'List of available languages in "/opt/homebrew/share/tessdata/" (3):\ndeu\neng\nosd\n';

/**
 * Tool dependencies whose `execFile` answers per program.
 *
 * @param answers - What `ocrmypdf` and `tesseract` resolve to, or the error they reject with.
 * @returns The spies.
 */
function createDeps(answers: Partial<Record<'ocrmypdf' | 'tesseract', Answer>> = {}) {
	const answer = (file: string): Answer =>
		answers[file as 'ocrmypdf' | 'tesseract'] ?? { stderr: '', stdout: '' };
	return {
		// oxlint-disable-next-line typescript/require-await -- the fake answers at once
		execFile: vi.fn<OcrToolDeps['execFile']>(async (file) => {
			const result = answer(file);
			if (result instanceof Error) {
				throw result;
			}
			return result;
		}),
		remove: vi.fn<OcrToolDeps['remove']>().mockResolvedValue(),
		rename: vi.fn<OcrToolDeps['rename']>().mockResolvedValue(),
	};
}

type Answer = Error | { stderr: string; stdout: string };

describe('the OCRmyPDF tools', () => {
	it('pass the check when OCRmyPDF runs and Tesseract knows German', async () => {
		const deps = createDeps({ tesseract: { stderr: '', stdout: LANGUAGES } });

		await expect(createOcrTools(deps).assertInstalled()).resolves.toBeUndefined();
		expect(deps.execFile).toHaveBeenCalledWith('ocrmypdf', ['--version']);
		expect(deps.execFile).toHaveBeenCalledWith('tesseract', ['--list-langs']);
	});

	it('also read the languages an older Tesseract prints to stderr', async () => {
		const deps = createDeps({ tesseract: { stderr: LANGUAGES, stdout: '' } });

		await expect(createOcrTools(deps).assertInstalled()).resolves.toBeUndefined();
	});

	it('name the install command when OCRmyPDF is missing', async () => {
		const deps = createDeps({ ocrmypdf: new Error('spawn ocrmypdf ENOENT') });

		await expect(createOcrTools(deps).assertInstalled()).rejects.toThrow(
			'OCRmyPDF fehlt. Installieren: brew install ocrmypdf tesseract-lang',
		);
	});

	it('refuse a Tesseract without German, also when only a German variant is there', async () => {
		const deps = createDeps({ tesseract: { stderr: '', stdout: 'eng\ndeu_latf\nosd\n' } });

		await expect(createOcrTools(deps).assertInstalled()).rejects.toThrow(
			'Tesseract kennt kein Deutsch (deu). Installieren: brew install tesseract-lang',
		);
	});

	it('refuse a missing Tesseract with the same hint', async () => {
		const deps = createDeps({
			tesseract: new Error('spawn tesseract ENOENT'),
		});

		await expect(createOcrTools(deps).assertInstalled()).rejects.toThrow(
			'Tesseract kennt kein Deutsch (deu). Installieren: brew install tesseract-lang',
		);
	});

	it('passes paths with spaces as single arguments', async () => {
		const deps = createDeps();
		const input = '/home/test/echo/ab 2024 (neues ECHO)/x.pdf';
		const output = '/home/test/echo/mit-textebene/ab 2024 (neues ECHO)/x.pdf';

		await createOcrTools(deps).recognize(input, output);

		expect(deps.execFile).toHaveBeenCalledWith('ocrmypdf', [...OCR_ARGS, input, `${output}.tmp`]);
		expect(deps.rename).toHaveBeenCalledWith(`${output}.tmp`, output);
	});

	it('only recognizes German pages without text and leaves the images alone', () => {
		expect(OCR_ARGS).toStrictEqual([
			'--mode',
			'skip',
			'--language',
			'deu',
			'--output-type',
			'pdf',
			'--optimize',
			'0',
		]);
	});

	it('removes the partial output when OCRmyPDF fails', async () => {
		const failure = Object.assign(new Error('Command failed: ocrmypdf'), {
			stderr: 'Scanning contents\nERROR - boom\n\n',
		});
		const deps = createDeps({ ocrmypdf: failure });

		await expect(createOcrTools(deps).recognize('/in.pdf', '/out/x.pdf')).rejects.toThrow(
			'OCRmyPDF ist gescheitert: ERROR - boom',
		);
		expect(deps.remove).toHaveBeenCalledWith('/out/x.pdf.tmp');
		expect(deps.rename).not.toHaveBeenCalled();
	});

	it('reports the failure even when the partial output cannot be removed', async () => {
		const deps = createDeps({ ocrmypdf: new Error('Command failed: ocrmypdf') });
		deps.remove.mockRejectedValue(new Error('EACCES'));

		await expect(createOcrTools(deps).recognize('/in.pdf', '/out/x.pdf')).rejects.toThrow(
			'OCRmyPDF ist gescheitert: Command failed: ocrmypdf',
		);
	});
});
