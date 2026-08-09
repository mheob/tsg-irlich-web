// This script is executed directly by Bun (`bun scripts/sync-dev-db.ts`) and is never
// loaded through `require(esm)`, so top-level await is safe here.
// oxlint-disable node/no-top-level-await

import { rm } from 'node:fs/promises';

import { $ } from 'bun';

const BACKUP_FILE = `${import.meta.dir}/production-backup.tar.gz`;
const SOURCE_DATASET = 'production';
const TARGET_DATASET = 'development';

async function run(cmd: string, errorMessage = 'An error occurred') {
	try {
		const lines = $`bun sanity datasets ${cmd}`.lines();
		for await (const line of lines) {
			console.log(line);
		}
	} catch (error) {
		console.error(errorMessage);
		throw error;
	}
}

async function cleanup() {
	if (await Bun.file(BACKUP_FILE).exists()) {
		await rm(BACKUP_FILE, { force: true });
		console.log('Cleaned up backup file.');
	}
}

async function exportSourceDataset() {
	console.log('Step 1: Exporting production dataset...');
	await run(`export ${SOURCE_DATASET} ${BACKUP_FILE}`);
}

async function recreateTargetDataset() {
	console.log('\nStep 2: Removing development dataset (if not exists)...');
	await run(`delete ${TARGET_DATASET} --force`);

	console.log('\nStep 3: Creating development dataset...');
	await run(`create ${TARGET_DATASET}`);
}

async function importIntoTargetDataset() {
	console.log('\nStep 4: Importing into development dataset...');
	await run(`import ${BACKUP_FILE} ${TARGET_DATASET} --replace`);
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
