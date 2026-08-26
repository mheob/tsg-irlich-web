import { describe, expect, it } from 'vitest';

import type * as groupsModule from '@/utils/groups';

import { loadWithEnv } from '../../test-utils/env';

type GroupsModule = typeof groupsModule;

const FALLBACK_ALT =
	'Sporthalle mit drei verschiedenen Trainingsgruppen: Links üben Kinder und ein Trainer in weißen Taekwondo-Anzügen mit schwarzem Gürtel synchrone Kicks, in der Mitte zeigen Mädchen in türkis-blauen Gymnastik-Trikots mit bunten Federn eine Beinübung, und rechts spielen Kinder unter Anleitung von Trainern in dunkelblauen Shirts Fußball auf einer grünen Kunstrasenfläche. Im Hintergrund sind bunte Gymnastikbälle und Sportgeräte zu sehen.';

describe('looking up the current department', () => {
	it('returns the department whose slug matches the given group', async () => {
		const { getCurrentDepartment, groupSections } = await loadWithEnv<GroupsModule>(
			'@/utils/groups',
			{},
		);

		const soccerSection = groupSections[0];

		expect(getCurrentDepartment('fussball')).toBe(soccerSection);
	});

	it('returns undefined for a group without a department page', async () => {
		const { getCurrentDepartment } = await loadWithEnv<GroupsModule>('@/utils/groups', {});

		expect(getCurrentDepartment('gibtsnicht')).toBeUndefined();
	});
});

describe('resolving a group image', () => {
	it('returns the matching image object using the default path', async () => {
		const { getGroupImage, groupSections } = await loadWithEnv<GroupsModule>('@/utils/groups', {});

		const soccerSection = groupSections[0];

		expect(getGroupImage('/angebot/fussball')).toBe(soccerSection.image);
	});

	it('returns the matching image object using the path production actually passes', async () => {
		const { getGroupImage, groupSections } = await loadWithEnv<GroupsModule>('@/utils/groups', {});

		const soccerSection = groupSections[0];

		expect(getGroupImage('fussball', '/angebot/')).toBe(soccerSection.image);
	});

	it('does not match when the path is missing its trailing separator', async () => {
		const { fallbackImage, getGroupImage } = await loadWithEnv<GroupsModule>('@/utils/groups', {});

		expect(getGroupImage('fussball', '/angebot')).toBe(fallbackImage);
	});

	it('falls back to the fallback image for an unknown group', async () => {
		const { fallbackImage, getGroupImage } = await loadWithEnv<GroupsModule>('@/utils/groups', {});

		expect(getGroupImage('gibtsnicht')).toBe(fallbackImage);
	});
});

describe('building the group open graph image', () => {
	it('builds the image of a known group on a fixed base url', async () => {
		const { getOGImage } = await loadWithEnv<GroupsModule>('@/utils/groups', {
			NODE_ENV: 'production',
			VERCEL_PROJECT_PRODUCTION_URL: 'tsg-irlich.vercel.app',
		});

		expect(getOGImage('fussball')).toStrictEqual({
			alt: 'Fußball',
			height: 630,
			url: 'https://tsg-irlich.vercel.app/og/angebot/groups/fussball.webp',
			width: 1200,
		});
	});

	it('falls back to the department overview image for an unknown group', async () => {
		const { getOGImage } = await loadWithEnv<GroupsModule>('@/utils/groups', {
			NODE_ENV: 'production',
			VERCEL_PROJECT_PRODUCTION_URL: 'tsg-irlich.vercel.app',
		});

		expect(getOGImage('gibtsnicht')).toStrictEqual({
			alt: FALLBACK_ALT,
			height: 630,
			url: 'https://tsg-irlich.vercel.app/og/angebot.webp',
			width: 1200,
		});
	});
});

describe('the offer group sections themselves', () => {
	it('gives every entry a slug below /angebot', async () => {
		const { groupSections } = await loadWithEnv<GroupsModule>('@/utils/groups', {});

		for (const section of groupSections) {
			expect(section.slug.startsWith('/angebot/')).toBe(true);
		}
	});

	it('gives every entry a non-empty alt text', async () => {
		const { groupSections } = await loadWithEnv<GroupsModule>('@/utils/groups', {});

		for (const section of groupSections) {
			expect(section.image.alt.length).toBeGreaterThan(0);
		}
	});

	it('gives every entry a unique type', async () => {
		const { groupSections } = await loadWithEnv<GroupsModule>('@/utils/groups', {});

		const types = new Set(groupSections.map((section) => section._type));

		expect(types.size).toBe(groupSections.length);
	});
});
