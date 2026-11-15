import type { MigrationContext, SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import migration from './index';

type DocumentMigration = (document: SanityDocument, context: MigrationContext) => unknown;

function migrate(fields: Record<string, unknown>): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return document(
		{
			_createdAt: '2026-01-01T00:00:00Z',
			_id: 'aboutUs',
			_rev: 'rev',
			_type: 'aboutUs',
			_updatedAt: '2026-01-01T00:00:00Z',
			...fields,
		},
		{} as MigrationContext,
	);
}

describe('about us drop long vision migration', () => {
	it('removes the long vision and its title and keeps the button text', () => {
		expect(
			migrate({
				content: {
					visionSection: {
						ctaLongVision: 'Siehe dir unsere Werte an',
						longVision: { _type: 'blockContent', text: [] },
						longVisionTitle: 'Unsere Werte',
					},
				},
			}),
		).toStrictEqual([
			{ op: { type: 'unset' }, path: ['content', 'visionSection', 'longVision'] },
			{ op: { type: 'unset' }, path: ['content', 'visionSection', 'longVisionTitle'] },
		]);
	});

	it('removes only what is set', () => {
		expect(
			migrate({ content: { visionSection: { longVisionTitle: 'Unsere Werte' } } }),
		).toStrictEqual([
			{ op: { type: 'unset' }, path: ['content', 'visionSection', 'longVisionTitle'] },
		]);
	});

	it.each([
		['without content', {}],
		['without a vision section', { content: {} }],
		['whose vision section has neither', { content: { visionSection: { title: 'Vision' } } }],
		['whose vision section is no object', { content: { visionSection: 'Vision' } }],
		['whose content is no object', { content: 'Inhalt' }],
	])('changes nothing on a page %s', (_case, fields) => {
		expect(migrate(fields)).toStrictEqual([]);
	});
});
