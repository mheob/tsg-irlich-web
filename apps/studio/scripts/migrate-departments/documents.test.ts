// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import {
	departmentIdOf,
	isOrphanedGroup,
	isPublished,
	isReleaseVersion,
	toPublishedId,
} from './documents';

describe('a document id', () => {
	it.each([
		['group-1', true],
		['drafts.group-1', false],
		['versions.r1.group-1', false],
	])('%s is published: %s', (id, published) => {
		expect(isPublished(id)).toBe(published);
	});

	it.each([
		['group-1', 'group-1'],
		['drafts.group-1', 'group-1'],
		['versions.rABC123.group-1', 'group-1'],
	])('%s belongs to the published id %s', (id, publishedId) => {
		expect(toPublishedId(id)).toBe(publishedId);
	});

	it('names a release version as such', () => {
		expect([
			isReleaseVersion('versions.r1.group-1'),
			isReleaseVersion('drafts.group-1'),
		]).toStrictEqual([true, false]);
	});
});

describe('a group', () => {
	it('references its department', () => {
		expect(departmentIdOf({ _id: 'g', department: { _ref: 'department-kurse' } })).toBe(
			'department-kurse',
		);
	});

	it.each([
		['a department string', { _id: 'g', department: 'soccer' }],
		['no department but the sport group flag', { _id: 'g', isSportGroup: false }],
	])('is left from 2024 with %s', (_label, group) => {
		expect(departmentIdOf(group)).toBeUndefined();
		expect(isOrphanedGroup(group)).toBe(true);
	});

	it.each([
		['a department reference', { _id: 'g', department: { _ref: 'department-kurse' } }],
		['no department yet, as a new draft', { _id: 'drafts.g', isSportGroup: null }],
	])('is current with %s', (_label, group) => {
		expect(isOrphanedGroup(group)).toBe(false);
	});
});
