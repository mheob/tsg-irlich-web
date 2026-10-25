// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { referencesId, rewriteReferences } from './references';

const NEW_IDS = new Map([['soccer-1', 'group-soccer-1']]);

/** A news body with an internal link in a mark definition, as the studio stores it. */
const BODY = [
	{
		_key: 'b1',
		_type: 'textBlock',
		text: [
			{
				_key: 't1',
				_type: 'block',
				markDefs: [
					{ _key: 'm1', _type: 'internalLink', link: { _ref: 'soccer-1', _type: 'reference' } },
				],
			},
		],
	},
];

describe('rewriting references', () => {
	it('replaces a reference however deep it sits and keeps everything around it', () => {
		expect(rewriteReferences({ _id: 'news-1', body: BODY }, NEW_IDS)).toStrictEqual({
			_id: 'news-1',
			body: [
				{
					_key: 'b1',
					_type: 'textBlock',
					text: [
						{
							_key: 't1',
							_type: 'block',
							markDefs: [
								{
									_key: 'm1',
									_type: 'internalLink',
									link: { _ref: 'group-soccer-1', _type: 'reference' },
								},
							],
						},
					],
				},
			],
		});
	});

	it('keeps the key and the weak flag of a reference', () => {
		expect(
			rewriteReferences({ _key: 'a1', _ref: 'soccer-1', _type: 'reference', _weak: true }, NEW_IDS),
		).toStrictEqual({ _key: 'a1', _ref: 'group-soccer-1', _type: 'reference', _weak: true });
	});

	// The studio strengthens a weak reference on publish and checks the target type then.
	it('points a pending strengthening at the new type', () => {
		expect(
			rewriteReferences(
				{
					_ref: 'soccer-1',
					_strengthenOnPublish: { template: { id: 'group.soccer' }, type: 'group.soccer' },
					_type: 'reference',
					_weak: true,
				},
				NEW_IDS,
			),
		).toStrictEqual({
			_ref: 'group-soccer-1',
			_strengthenOnPublish: { template: { id: 'group.soccer' }, type: 'group' },
			_type: 'reference',
			_weak: true,
		});
	});

	it('hands back the very same value when nothing points at a legacy group', () => {
		const person = { _id: 'person-1', team: { _ref: 'group-x', _type: 'reference' }, tags: ['a'] };

		expect(rewriteReferences(person, NEW_IDS)).toBe(person);
	});

	it('changes only the branch that holds the reference', () => {
		const untouched = { _ref: 'role-1', _type: 'reference' };
		const rewritten = rewriteReferences(
			{ role: untouched, team: { _ref: 'soccer-1', _type: 'reference' } },
			NEW_IDS,
		) as { role: unknown };

		expect(rewritten.role).toBe(untouched);
	});
});

describe('finding a reference', () => {
	it('finds an id however deep it sits', () => {
		expect(referencesId({ body: BODY }, 'soccer-1')).toBe(true);
	});

	it('finds nothing where the id only appears as text', () => {
		expect(referencesId({ title: 'soccer-1', _id: 'soccer-1' }, 'soccer-1')).toBe(false);
	});
});
