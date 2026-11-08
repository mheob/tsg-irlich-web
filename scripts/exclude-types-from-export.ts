import { execFile } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, readdir, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';

const NDJSON_FILE = 'data.ndjson';

// `node:child_process` has no promise API for `execFile`, and `strict-void-return` flags the types
// `promisify` infers for it.
// oxlint-disable-next-line typescript/strict-void-return
const execFileAsync = promisify(execFile);

// A line that is no JSON object stays in the export, so a format change of the CLI never makes this
// drop documents it does not understand.
function readType(line: string): unknown {
	try {
		const parsed: unknown = JSON.parse(line);
		return typeof parsed === 'object' && parsed !== null && '_type' in parsed
			? parsed._type
			: undefined;
	} catch {
		return undefined;
	}
}

// Copies the documents line by line, since the export of a dataset can be large. `removed` counts
// the dropped ones.
async function filterNdjson(source: string, target: string, types: ReadonlySet<string>) {
	const counter = { removed: 0 };
	const lines = createInterface({ crlfDelay: Infinity, input: createReadStream(source) });

	async function* keptLines() {
		for await (const line of lines) {
			const type = readType(line);

			if (typeof type === 'string' && types.has(type)) {
				counter.removed += 1;
			} else if (line.length > 0) {
				yield `${line}\n`;
			}
		}
	}

	await pipeline(keptLines(), createWriteStream(target));
	return counter.removed;
}

async function readExportFolder(workDir: string, archivePath: string): Promise<string> {
	const [folder, ...others] = await readdir(workDir);

	// The export holds a single folder named after the dataset
	if (!folder || others.length > 0) {
		throw new Error(`Unexpected layout of ${archivePath}: expected a single top-level folder`);
	}

	return folder;
}

/**
 * Removes every document of the given types from a `sanity datasets export` archive, in place.
 * Assets and everything else in the archive stay untouched.
 * @param archivePath The `.tar.gz` the export wrote.
 * @param types The `_type` values to drop.
 * @returns The number of removed documents.
 */
export async function excludeTypesFromExport(
	archivePath: string,
	types: readonly string[],
): Promise<number> {
	const workDir = await mkdtemp(path.join(tmpdir(), 'exclude-types-'));

	try {
		await execFileAsync('tar', ['-xzf', archivePath, '-C', workDir]);

		const folder = await readExportFolder(workDir, archivePath);
		const ndjsonPath = path.join(workDir, folder, NDJSON_FILE);
		const removed = await filterNdjson(ndjsonPath, `${ndjsonPath}.filtered`, new Set(types));

		await rename(`${ndjsonPath}.filtered`, ndjsonPath);
		await execFileAsync('tar', ['-czf', archivePath, '-C', workDir, folder]);

		return removed;
	} finally {
		await rm(workDir, { force: true, recursive: true });
	}
}
