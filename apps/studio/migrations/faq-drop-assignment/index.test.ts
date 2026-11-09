import type { MigrationContext, SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import migration from './index';

type DocumentMigration = (document: SanityDocument, context: MigrationContext) => unknown;

const QUESTION: Record<string, unknown> = { question: 'Was kostet es?' };

function migrate(fields: Record<string, unknown>): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return document(
		{
			_createdAt: '2026-01-01T00:00:00Z',
			_id: 'drafts.faq-a',
			_rev: 'rev',
			_type: 'faq',
			_updatedAt: '2026-01-01T00:00:00Z',
			...QUESTION,
			...fields,
		},
		{} as MigrationContext,
	);
}

describe('faq drop assignment migration', () => {
	it('removes the departments and the sort order', () => {
		expect(migrate({ departments: [{ _ref: 'department-a' }], sortOrder: 110 })).toStrictEqual([
			{ op: { type: 'unset' }, path: ['departments'] },
			{ op: { type: 'unset' }, path: ['sortOrder'] },
		]);
	});

	it('removes only what is set', () => {
		expect(migrate({ sortOrder: 110 })).toStrictEqual([
			{ op: { type: 'unset' }, path: ['sortOrder'] },
		]);
	});

	it('changes nothing on a FAQ without them', () => {
		expect(migrate({})).toStrictEqual([]);
	});
});
