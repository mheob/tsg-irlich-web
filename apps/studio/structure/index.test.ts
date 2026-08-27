import type { StructureBuilder } from 'sanity/structure';
import { describe, expect, it } from 'vitest';

import { getGroup, isExcludedDefaultListItem } from './index';

interface RecordedCall {
	readonly args: unknown[];
	readonly method: string;
}

/**
 * `getGroup` only ever chains method calls on the `StructureBuilder` it receives (`.listItem()`,
 * `.title()`, `.documentTypeListItem()`, …) and never reads a value back out of it. A proxy that
 * records every call and always returns itself for chaining is therefore enough to observe which
 * document types and ids a given group asks the structure builder to render, without needing a
 * real Studio structure builder.
 *
 * @returns The recorded calls, plus the fake structure builder that records them.
 */
function createRecordingStructureBuilder(): {
	calls: RecordedCall[];
	structureBuilder: StructureBuilder;
} {
	const calls: RecordedCall[] = [];
	const proxy: unknown = new Proxy(
		{},
		{
			get(_target, property) {
				return (...args: unknown[]) => {
					calls.push({ args, method: String(property) });
					return proxy;
				};
			},
		},
	);
	return { calls, structureBuilder: proxy as StructureBuilder };
}

describe('excluded default list items', () => {
	it('excludes a type that already has a dedicated place in the desk structure', () => {
		expect(isExcludedDefaultListItem('news.article')).toBe(false);
	});

	it('does not exclude a type with no dedicated place', () => {
		expect(isExcludedDefaultListItem('some-unlisted-type')).toBe(true);
	});

	it('does not exclude a missing id', () => {
		expect(isExcludedDefaultListItem()).toBe(false);
	});
});

describe('desk group resolution', () => {
	it('resolves the news group for a known group name', () => {
		const { calls, structureBuilder } = createRecordingStructureBuilder();

		getGroup(structureBuilder, 'news');

		const documentTypes = calls
			.filter((call) => call.method === 'documentTypeListItem')
			.map((call) => call.args[0]);

		expect(documentTypes).toStrictEqual(['news.article', 'news.category']);
	});

	it('resolves the settings group when called directly with a known group name', () => {
		const { calls, structureBuilder } = createRecordingStructureBuilder();

		getGroup(structureBuilder, 'settings');

		const documentTypes = calls
			.filter((call) => call.method === 'documentTypeListItem')
			.map((call) => call.args[0]);
		const ids = calls.filter((call) => call.method === 'id').map((call) => call.args[0]);

		expect(documentTypes).toStrictEqual(['assist.instruction.context']);
		expect(ids).toStrictEqual(['site-settings']);
	});

	it('falls back to the settings group for an unknown group name', () => {
		const { calls, structureBuilder } = createRecordingStructureBuilder();

		getGroup(structureBuilder, 'not-a-real-group' as never);

		const documentTypes = calls
			.filter((call) => call.method === 'documentTypeListItem')
			.map((call) => call.args[0]);
		const ids = calls.filter((call) => call.method === 'id').map((call) => call.args[0]);

		expect(documentTypes).toStrictEqual(['assist.instruction.context']);
		expect(ids).toStrictEqual(['site-settings']);
	});
});
