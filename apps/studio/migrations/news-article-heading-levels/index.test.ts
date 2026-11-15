import type { SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import migration, { getHeadingLevelPatches } from './index';

type DocumentMigration = (document: SanityDocument) => unknown;

function migrate(fields: Record<string, unknown>): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return document({
		_createdAt: '2026-01-01T00:00:00Z',
		_id: 'article',
		_rev: 'rev',
		_type: 'news.article',
		_updatedAt: '2026-01-01T00:00:00Z',
		...fields,
	});
}

function block(key: string, style: string): Record<string, unknown> {
	return { _key: key, _type: 'block', children: [], style };
}

function section(key: string, ...text: unknown[]): Record<string, unknown> {
	return { _key: key, _type: 'blockContent', text };
}

describe('news article heading levels', () => {
	it('sets the style of every H3 before the first H2 to H2', () => {
		const body = [
			section('a', block('a1', 'h3'), block('a2', 'normal')),
			section('b', block('b1', 'h3'), block('b2', 'h2'), block('b3', 'h3')),
		];

		expect(getHeadingLevelPatches(body)).toStrictEqual([
			{
				op: { type: 'set', value: 'h2' },
				path: ['body', { _key: 'a' }, 'text', { _key: 'a1' }, 'style'],
			},
			{
				op: { type: 'set', value: 'h2' },
				path: ['body', { _key: 'b' }, 'text', { _key: 'b1' }, 'style'],
			},
		]);
	});

	it('patches the body of an article that skips a level', () => {
		const body = [section('a', block('a1', 'h3'))];

		expect(migrate({ body })).toStrictEqual([
			expect.objectContaining({
				path: ['body', { _key: 'a' }, 'text', { _key: 'a1' }, 'style'],
			}),
		]);
	});

	it('patches nothing once the body opens with an H2, so a second run changes nothing', () => {
		const body = [section('a', block('a1', 'h2'), block('a2', 'h3'))];

		expect(migrate({ body })).toStrictEqual([]);
		expect(migrate({})).toStrictEqual([]);
	});
});
