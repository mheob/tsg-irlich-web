import { describe, expect, it } from 'vitest';

import { socialMediaMap } from '@/components/ui/social-media-icon';
import { getSocialMediaEntries } from '@/utils/icon';

describe('turning sanity social fields into renderable entries', () => {
	it('returns no entries for a null social fields object', () => {
		expect(getSocialMediaEntries(null)).toStrictEqual([]);
	});

	it('returns no entries for an undefined social fields object', () => {
		const socialFields: Parameters<typeof getSocialMediaEntries>[0] = undefined;

		expect(getSocialMediaEntries(socialFields)).toStrictEqual([]);
	});

	it('returns no entries for an empty social fields object', () => {
		expect(getSocialMediaEntries({})).toStrictEqual([]);
	});

	it('turns a known platform with a url into one entry', () => {
		const entries = getSocialMediaEntries({ facebook: 'https://facebook.com/tsg-irlich' });

		expect(entries).toStrictEqual([
			{ icon: socialMediaMap.facebook, name: 'facebook', url: 'https://facebook.com/tsg-irlich' },
		]);
	});

	it('skips the sanity meta key', () => {
		expect(getSocialMediaEntries({ _type: 'socialFields' })).toStrictEqual([]);
	});

	it('skips a known platform with an undefined url', () => {
		expect(getSocialMediaEntries({ instagram: undefined })).toStrictEqual([]);
	});

	it('skips a known platform with an empty url', () => {
		expect(getSocialMediaEntries({ instagram: '' })).toStrictEqual([]);
	});

	it('skips an unknown key', () => {
		expect(getSocialMediaEntries({ mastodon: 'https://mastodon.social/@tsg' })).toStrictEqual([]);
	});

	it('returns several platforms in object-key order', () => {
		const entries = getSocialMediaEntries({
			whatsapp: 'https://wa.me/1234567',
			youtube: 'https://youtube.com/tsg-irlich',
		});

		expect(entries).toStrictEqual([
			{ icon: socialMediaMap.whatsapp, name: 'whatsapp', url: 'https://wa.me/1234567' },
			{ icon: socialMediaMap.youtube, name: 'youtube', url: 'https://youtube.com/tsg-irlich' },
		]);
	});
});
