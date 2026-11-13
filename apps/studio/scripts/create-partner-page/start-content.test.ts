// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import { buildStartContent, readDataset } from './start-content';

const HERO_IMAGE = {
	_type: 'extendedImage',
	asset: { _ref: 'image-abc-100x100-jpg', _type: 'reference' as const },
	hotspot: { height: 0.5, width: 0.5, x: 0.5, y: 0.5 },
};

describe('the start content of the partner page', () => {
	const page = buildStartContent(HERO_IMAGE);
	const { reasons } = page.content.whySection;
	const { ways } = page.content.waysSection;

	it('is a draft of the singleton with the fixed slug', () => {
		expect(page).toMatchObject({
			_id: 'drafts.partnerPage',
			_type: 'partnerPage',
			slug: { _type: 'slug', current: 'partner' },
			subtitle: 'Gemeinsam stark',
			title: 'Sponsoren & Partner',
		});
	});

	it('has the four reasons and the four ways of the prototype in order', () => {
		expect(reasons.map((card) => card.title)).toStrictEqual([
			'Regionale Sichtbarkeit',
			'Reichweite online',
			'Positives Image',
			'Langfristige Partnerschaft',
		]);
		expect(ways.map((card) => card.title)).toStrictEqual([
			'Trikotwerbung',
			'Bandenwerbung',
			'Online-Partner',
			'Sachspenden',
		]);
		expect(ways.map((way) => way.benefits.length)).toStrictEqual([3, 3, 3, 3]);
		expect(ways.every((way) => !('cta' in way))).toBe(true);
	});

	it('only uses icons the studio offers', () => {
		const offered = PAGE_ICONS.map((icon) => icon.value);
		expect(offered).toStrictEqual(
			expect.arrayContaining([...reasons, ...ways].map((card) => card.icon)),
		);
	});

	it('gives every array item a unique key', () => {
		const keys = [
			...reasons.map((card) => card._key),
			...ways.map((card) => card._key),
			...page.content.contactPersonsSection.contactPersons.map((person) => person._key),
		];
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('references the three contact persons in order', () => {
		expect(page.content.contactPersonsSection.contactPersons).toStrictEqual(
			[
				'b9c684aa-f914-4c32-8619-fde519d41315',
				'62de97e4-4c14-4336-89f0-615645b28053',
				'7ba77a4c-f4f1-45ca-9b7a-bd8eac97b9e1',
			].map((id) => ({ _key: id, _ref: id, _type: 'reference' })),
		);
	});

	it('carries the idea, logo and inquiry presets', () => {
		expect(page.content.waysSection).toMatchObject({
			ideaCta: 'Jetzt Kontakt aufnehmen',
			ideaText: 'Du hast eine eigene Idee? Wir schnüren gern ein individuelles Paket.',
		});
		expect(page.content.partnersSection.ownLogoText).toBe('Dein Logo hier?');
		expect(page.inquiry).toStrictEqual({
			email: 'partner@tsg-irlich.de',
			subject: 'Sponsoring bei der TSG Irlich',
		});
	});

	it('copies the hero image as given', () => {
		expect(page.heroImage).toStrictEqual(HERO_IMAGE);
	});

	it('leaves the hero image out when there is none', () => {
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect('heroImage' in buildStartContent(undefined)).toBe(false);
	});
});

describe('the dataset of the start content', () => {
	it('reads the dataset after the separator of sanity exec', () => {
		expect(readDataset(['--', '--dataset', 'production'])).toBe('production');
	});

	it('reads the dataset without a separator', () => {
		expect(readDataset(['--dataset', 'development'])).toBe('development');
	});

	it('refuses to guess a dataset', () => {
		expect(() => readDataset([])).toThrow('--dataset fehlt, z. B. --dataset development.');
	});
});
