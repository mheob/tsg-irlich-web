import { settle } from '@tsgi-web/shared';

/**
 * German, only the pages without text, a plain PDF and no image optimization: the page images stay
 * byte for byte as they were, and the text sits invisibly on top (OCRmyPDF 17, WEB-402 Task 1).
 */
const OCR_ARGS = [
	'--mode',
	'skip',
	'--language',
	'deu',
	'--output-type',
	'pdf',
	'--optimize',
	'0',
] as const;
const GERMAN = 'deu';
const PARTIAL_SUFFIX = '.tmp';
const LAST = -1;

/**
 * The last line of a program's error output that says something.
 *
 * @param error - What `execFile` rejected with; it carries `stderr` when the program ran.
 * @returns That line, or the error's message.
 */
function describeFailure(error: unknown): string {
	const stderr = error instanceof Error && 'stderr' in error ? String(error.stderr) : '';
	const lines = stderr.split('\n').filter((line) => line.trim() !== '');
	return lines.at(LAST) ?? (error instanceof Error ? error.message : String(error));
}

/**
 * The command-line tools the text layer needs, behind `execFile`, so nothing runs through a shell
 * and the paths with spaces arrive as one argument each.
 *
 * @param deps - `execFile`, and the file operations for the partial output.
 * @returns The tools.
 */
function createOcrTools(deps: OcrToolDeps): OcrTools {
	return {
		assertInstalled: async () => {
			const version = await settle(deps.execFile('ocrmypdf', ['--version']));
			if (!version.ok) {
				throw new Error('OCRmyPDF fehlt. Installieren: brew install ocrmypdf tesseract-lang');
			}
			const languages = await settle(deps.execFile('tesseract', ['--list-langs']));
			const listed = languages.ok ? `${languages.value.stdout}\n${languages.value.stderr}` : '';
			if (!listed.split('\n').some((line) => line.trim() === GERMAN)) {
				throw new Error(
					'Tesseract kennt kein Deutsch (deu). Installieren: brew install tesseract-lang',
				);
			}
		},
		recognize: async (input, output) => {
			// OCRmyPDF writes into a partial file that only becomes the output once it is complete, so
			// an interrupted run never leaves a file the next run would take as a finished one.
			const partial = `${output}${PARTIAL_SUFFIX}`;
			const ran = await settle(deps.execFile('ocrmypdf', [...OCR_ARGS, input, partial]));
			if (!ran.ok) {
				await settle(deps.remove(partial));
				throw new Error(`OCRmyPDF ist gescheitert: ${describeFailure(ran.error)}`);
			}
			await deps.rename(partial, output);
		},
	};
}

interface OcrToolDeps {
	/** Runs a program without a shell. Rejects with `stderr` attached when it exits with an error. */
	execFile: (file: string, args: readonly string[]) => Promise<{ stderr: string; stdout: string }>;
	/** Deletes a file; resolves when it is already gone. */
	remove: (file: string) => Promise<void>;
	rename: (from: string, to: string) => Promise<void>;
}

interface OcrTools {
	/** Fails before anything is touched when OCRmyPDF or Tesseract's German is missing. */
	assertInstalled: () => Promise<void>;
	/** Writes `input` with a text layer on every page that had none to `output`. */
	recognize: (input: string, output: string) => Promise<void>;
}

export { OCR_ARGS, createOcrTools };
export type { OcrToolDeps, OcrTools };
