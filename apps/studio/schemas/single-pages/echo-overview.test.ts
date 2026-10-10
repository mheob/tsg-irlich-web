import { describe, expect, it } from 'vite-plus/test';

import echoOverviewPage from './echo-overview';

interface OverviewField {
	group?: string;
	initialValue?: unknown;
	name: string;
	readOnly?: boolean;
	type: string;
}

const fields = echoOverviewPage.fields as unknown as OverviewField[];

function field(name: string): OverviewField | undefined {
	return fields.find((candidate) => candidate.name === name);
}

describe('echo overview page', () => {
	// The archive lives at /verein/echo; editors must not be able to move it.
	it('fixes its slug to echo', () => {
		expect(field('slug')).toMatchObject({ initialValue: { current: 'echo' }, readOnly: true });
	});

	it('offers the hero, the intro and the meta fields', () => {
		expect(fields.map((candidate) => candidate.name)).toStrictEqual([
			'slug',
			'title',
			'subtitle',
			'intro',
			'meta',
		]);
	});

	it('lets editors format the intro in the general group', () => {
		expect(field('intro')).toMatchObject({ group: 'general', type: 'simpleBlockContent' });
	});

	it('shows a fixed title in lists', () => {
		expect(echoOverviewPage.preview.prepare()).toStrictEqual({ title: 'TSG-Echo Übersicht' });
	});
});
