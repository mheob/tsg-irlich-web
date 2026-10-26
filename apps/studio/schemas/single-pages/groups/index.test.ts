import { describe, expect, it } from 'vite-plus/test';

import groupsPage from './index';

interface ObjectField {
	readonly fields?: readonly ObjectField[];
	readonly group?: string;
	readonly groups?: readonly { readonly name: string; readonly title: string }[];
	readonly name: string;
	readonly validation?: unknown;
}

function getContent(): ObjectField {
	const content = (groupsPage.fields as readonly ObjectField[]).find(
		(field) => field.name === 'content',
	);
	if (!content) {
		throw new Error('Expected the groups page to declare a "content" field.');
	}
	return content;
}

describe('groups page content', () => {
	it('offers an optional FAQ heading between the groups and the contact persons', () => {
		const content = getContent();
		const faqSection = content.fields?.find((field) => field.name === 'faqSection');

		expect(content.fields?.map((field) => field.name)).toStrictEqual([
			'groupsSection',
			'faqSection',
			'contactPersonsSection',
		]);
		expect(faqSection?.validation).toBeUndefined();
		expect(faqSection?.fields?.map((field) => field.name)).toStrictEqual([
			'title',
			'subtitle',
			'intro',
		]);
		expect(faqSection?.group).toBe('faq');
		expect(content.groups).toContainEqual({ name: 'faq', title: 'FAQ' });
	});
});
