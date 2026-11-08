import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { rm, stat } from 'node:fs/promises';
import { text } from 'node:stream/consumers';
import { setTimeout } from 'node:timers/promises';

import { excludeTypesFromExport } from './exclude-types-from-export.ts';

const BACKUP_FILE = `${import.meta.dirname}/production-backup.tar.gz`;
// The Sanity CLI resolves the project ID from the studio config, so it has to run there
const STUDIO_DIR = `${import.meta.dirname}/../apps/studio`;
const SOURCE_DATASET = 'production';
const TARGET_DATASET = 'development';
const CREATE_RETRY_DELAY_MS = 2000;
const CREATE_TIMEOUT_MS = 120_000;
// Submissions hold personal data, and the clean-up cron only runs on production
const EXCLUDED_TYPES = ['form.submission'];

type Output = 'inherit' | 'pipe';

// `pnpm exec` picks up the Sanity CLI from the studio workspace, whose node_modules is the
// only place it is installed.
function spawnSanity(args: string[], stdout: Output, stderr: Output = 'inherit') {
	return spawn('pnpm', ['exec', 'sanity', 'datasets', ...args], {
		cwd: STUDIO_DIR,
		stdio: ['inherit', stdout, stderr],
	});
}

// `once` rejects when the child emits `error` first, for instance when `pnpm` cannot be spawned.
// `close` reports a `null` code for a child that a signal ended, which counts as a failure.
async function waitForExit(child: ReturnType<typeof spawnSanity>): Promise<number> {
	const closeArgs: unknown[] = await once(child, 'close');
	const [code] = closeArgs;
	return typeof code === 'number' ? code : 1;
}

// The streams are inherited so the CLI writes straight to this terminal: it reports
// progress on stderr and redraws it without newlines, which a piped reader only
// surfaces once the command has finished.
async function run(args: string[], errorMessage = 'An error occurred') {
	const exitCode = await waitForExit(spawnSanity(args, 'inherit'));

	if (exitCode !== 0) {
		console.error(errorMessage);
		throw new Error(`"sanity datasets ${args.join(' ')}" exited with code ${exitCode}`);
	}
}

// Reads the dataset names so a missing target is not treated as a failure. This is the
// one command whose output is parsed rather than shown.
async function listDatasets(): Promise<string[]> {
	const child = spawnSanity(['list'], 'pipe');

	if (!child.stdout) {
		throw new Error('"sanity datasets list" was spawned without a readable stdout');
	}

	const [output, exitCode] = await Promise.all([text(child.stdout), waitForExit(child)]);

	if (exitCode !== 0) {
		throw new Error(`"sanity datasets list" exited with code ${exitCode}`);
	}

	return output
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

// Creates the target dataset once and reports a conflict with an old dataset of that name that is
// still being deleted instead of failing on it. Its stderr is read for that, so it is shown here
// only afterwards, and not at all for that conflict.
async function tryCreateTargetDataset(): Promise<'created' | 'still-deleting'> {
	const child = spawnSanity(['create', TARGET_DATASET], 'inherit', 'pipe');

	if (!child.stderr) {
		throw new Error('"sanity datasets create" was spawned without a readable stderr');
	}

	const [output, exitCode] = await Promise.all([text(child.stderr), waitForExit(child)]);

	// The CLI wraps its message and starts every line of it with `›`.
	if (exitCode !== 0 && output.replaceAll(/[\s›]+/gu, ' ').includes('is being deleted')) {
		return 'still-deleting';
	}

	process.stderr.write(output);

	if (exitCode !== 0) {
		throw new Error(`"sanity datasets create ${TARGET_DATASET}" exited with code ${exitCode}`);
	}

	return 'created';
}

// `sanity datasets delete` returns while Sanity is still removing the dataset, and `sanity datasets
// list` leaves it out from then on. Creating one under the same name fails with a conflict for a few
// seconds longer, which left "development" deleted and not recreated (WEB-404).
async function createTargetDataset(deadline = Date.now() + CREATE_TIMEOUT_MS): Promise<void> {
	if ((await tryCreateTargetDataset()) === 'created') {
		return;
	}

	if (Date.now() > deadline) {
		throw new Error(`"${TARGET_DATASET}" was still being deleted after ${CREATE_TIMEOUT_MS} ms`);
	}

	console.log(`"${TARGET_DATASET}" is still being deleted, trying again...`);
	await setTimeout(CREATE_RETRY_DELAY_MS);
	await createTargetDataset(deadline);
}

async function cleanup() {
	try {
		await stat(BACKUP_FILE);
	} catch {
		return;
	}

	await rm(BACKUP_FILE, { force: true });
	console.log('Cleaned up backup file.');
}

async function exportSourceDataset() {
	console.log('Step 1: Exporting production dataset...');
	await run(['export', SOURCE_DATASET, BACKUP_FILE]);

	const removed = await excludeTypesFromExport(BACKUP_FILE, EXCLUDED_TYPES);
	console.log(`${removed} Eingänge nicht übernommen`);
}

async function recreateTargetDataset() {
	const datasets = await listDatasets();

	if (datasets.includes(TARGET_DATASET)) {
		console.log('\nStep 2: Removing development dataset...');
		await run(['delete', TARGET_DATASET, '--force']);
	} else {
		console.log('\nStep 2: No development dataset to remove, skipping...');
	}

	console.log('\nStep 3: Creating development dataset...');
	await createTargetDataset();
}

async function importIntoTargetDataset() {
	console.log('\nStep 4: Importing into development dataset...');
	await run(['import', BACKUP_FILE, TARGET_DATASET, '--replace']);
}

console.log(`\nOverwriting "${TARGET_DATASET}" dataset with data from "${SOURCE_DATASET}"...\n`);

try {
	await exportSourceDataset();
	await recreateTargetDataset();
	await importIntoTargetDataset();

	console.log(`\nDone! "${TARGET_DATASET}" now mirrors "${SOURCE_DATASET}".`);
} finally {
	await cleanup();
}
