import { settle } from '@tsgi-web/shared';

import type { MigrationStore } from './store';

const PROBE_TARGET_ID = 'migration-probe-target';
const PROBE_REFERRER_ID = 'migration-probe-referrer';
const PROBE_TITLE = 'Migrationsprobe';
/** What the probe returns when Sanity accepts the swap and the reference still resolves. */
const PROBE_OK = 'ok';

/** Kept through the swap like the creation date of every migrated group. */
const PROBE_CREATED_AT = '2024-09-23T10:00:49Z';

/** A legacy group, as the persons of the dataset reference them. */
const PROBE_TARGET = {
	_createdAt: PROBE_CREATED_AT,
	_id: PROBE_TARGET_ID,
	_type: 'group.soccer',
	title: PROBE_TITLE,
};
/** A person whose first affiliation strongly references the target. */
const PROBE_REFERRER = {
	_id: PROBE_REFERRER_ID,
	_type: 'person',
	affiliations: [
		{
			_key: 'probe',
			_type: 'affiliation',
			team: { _ref: PROBE_TARGET_ID, _type: 'reference' },
		},
	],
	firstName: PROBE_TITLE,
	lastName: 'Bitte löschen',
};
/** The target after the swap. No department: none may exist yet when the probe runs. */
const PROBE_SWAPPED = {
	_createdAt: PROBE_CREATED_AT,
	_id: PROBE_TARGET_ID,
	_type: 'group',
	title: PROBE_TITLE,
};

/**
 * A rejection reason as text.
 *
 * @param error - Whatever was thrown.
 * @returns The message.
 */
function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Deletes both probe documents, the referrer first, so the target is free to go. Deleting a
 * document that does not exist is no error, so this also clears what an aborted probe left.
 *
 * @param store - The Sanity side.
 */
async function removeProbeDocuments(store: MigrationStore): Promise<void> {
	await store.deleteDocument(PROBE_REFERRER_ID);
	await store.deleteDocument(PROBE_TARGET_ID);
}

/**
 * Creates the target and its referrer, swaps the target's type and checks the reference.
 *
 * @param store - The Sanity side.
 * @returns `ok`, or what went wrong.
 * @throws {Error} When Sanity rejects a write, the swap above all.
 */
async function swapUnderReference(store: MigrationStore): Promise<string> {
	await store.createOrReplace(PROBE_TARGET);
	await store.createOrReplace(PROBE_REFERRER);
	await store.swapType(PROBE_TARGET_ID, PROBE_SWAPPED);
	const [persons, groups] = await Promise.all([store.fetchPersons(), store.fetchGroups()]);
	const teamId = persons.find(({ _id }) => _id === PROBE_REFERRER_ID)?.affiliations?.[0]?.team
		?._ref;
	return groups.some(({ _id }) => _id === teamId)
		? PROBE_OK
		: `Der Verweis der Person zeigt nach dem Typwechsel ins Leere (${teamId ?? 'kein Verweis'}).`;
}

/**
 * Tries the type swap of the migration on two documents of its own, before the real run: does
 * Sanity let a strongly referenced document be replaced by one of another type with the same id?
 * Both documents are deleted again in any case.
 *
 * @param store - The Sanity side.
 * @returns `ok`, or the message Sanity rejected the swap with.
 */
async function runTypeSwapProbe(store: MigrationStore): Promise<string> {
	await removeProbeDocuments(store);
	const outcome = await settle(swapUnderReference(store));
	await removeProbeDocuments(store);
	return outcome.ok ? outcome.value : describeError(outcome.error);
}

export { PROBE_OK, PROBE_REFERRER_ID, PROBE_TARGET_ID, runTypeSwapProbe };
