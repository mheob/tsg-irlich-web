// This script is executed directly by Node (`node scripts/sync-dev-db.ts`), which strips the
// type annotations on the fly, and is never loaded through `require(esm)`, so top-level await
// is safe here.
// oxlint-disable node/no-top-level-await

import { spawn } from 'node:child_process';
import { rm, stat } from 'node:fs/promises';
import { text } from 'node:stream/consumers';

const BACKUP_FILE = `${import.meta.dirname}/production-backup.tar.gz`;
// The Sanity CLI resolves the project ID from the studio config, so it has to run there
const STUDIO_DIR = `${import.meta.dirname}/../apps/studio`;
const SOURCE_DATASET = 'production';
const TARGET_DATASET = 'development';

// `pnpm exec` picks up the Sanity CLI from the studio workspace, whose node_modules is the
// only place it is installed.
function spawnSanity(args: string[], stdout: 'inherit' | 'pipe') {
	return spawn('pnpm', ['exec', 'sanity', 'datasets', ...args], {
		cwd: STUDIO_DIR,
		stdio: ['inherit', stdout, 'inherit'],
	});
}

async function waitForExit(child: ReturnType<typeof spawnSanity>): Promise<number> {
	return new Promise((resolve, reject) => {
		child.on('error', reject);
		child.on('close', (code) => {
			resolve(code ?? 1);
		});
	});
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
	await run(['create', TARGET_DATASET]);
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
