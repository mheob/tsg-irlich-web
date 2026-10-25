// @vitest-environment node
import { access } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { DEPARTMENT_SEEDS } from './seeds';

const IMAGE_FOLDER = path.join(import.meta.dirname, 'images');

describe('the department seeds', () => {
	it('follow today’s order, titles, slugs and icons', () => {
		expect(
			DEPARTMENT_SEEDS.map(({ icon, id, slug, sortOrder, title }) => ({
				icon,
				id,
				slug,
				sortOrder,
				title,
			})),
		).toStrictEqual([
			{
				icon: 'Fussball',
				id: 'department-fussball',
				slug: 'fussball',
				sortOrder: 10,
				title: 'Fußball',
			},
			{
				icon: 'Turnen',
				id: 'department-kinderturnen',
				slug: 'kinderturnen',
				sortOrder: 20,
				title: 'Kinderturnen',
			},
			{ icon: 'StepAerobic', id: 'department-kurse', slug: 'kurse', sortOrder: 30, title: 'Kurse' },
			{
				icon: 'Taekwondo',
				id: 'department-taekwondo',
				slug: 'taekwondo',
				sortOrder: 40,
				title: 'Taekwondo',
			},
			{ icon: 'Tanzen', id: 'department-tanzen', slug: 'tanzen', sortOrder: 50, title: 'Tanzen' },
			{
				icon: 'Fitness',
				id: 'department-weitere-sportarten',
				slug: 'weitere-sportarten',
				sortOrder: 60,
				title: 'Weitere Sportarten',
			},
		]);
	});

	it('make only Fußball a team sport with its own contact email', () => {
		expect(
			DEPARTMENT_SEEDS.map(({ contactEmail, isTeamSport, slug }) => [
				slug,
				isTeamSport,
				contactEmail,
			]),
		).toStrictEqual([
			['fussball', true, 'fussball@tsg-irlich.de'],
			['kinderturnen', false, 'breitensport@tsg-irlich.de'],
			['kurse', false, 'breitensport@tsg-irlich.de'],
			['taekwondo', false, 'breitensport@tsg-irlich.de'],
			['tanzen', false, 'breitensport@tsg-irlich.de'],
			['weitere-sportarten', false, 'breitensport@tsg-irlich.de'],
		]);
	});

	it('map the legacy group types and person strings', () => {
		expect(
			DEPARTMENT_SEEDS.map(({ legacyAffiliation, legacyType }) => [legacyType, legacyAffiliation]),
		).toStrictEqual([
			['group.soccer', 'soccer'],
			['group.children-gymnastics', 'children-gymnastics'],
			['group.courses', 'courses'],
			['group.taekwondo', 'taekwondo'],
			['group.dance', 'dance'],
			['group.other-sports', 'other-sports'],
		]);
	});

	it('name image files that exist', async () => {
		const files = DEPARTMENT_SEEDS.flatMap(({ images }) => [
			images.card,
			images.hero,
			images.openGraph,
		]);

		const found = await Promise.allSettled(
			files.map(async (file) => access(path.join(IMAGE_FOLDER, file))),
		);

		expect(files).toHaveLength(18);
		expect(files.filter((_, index) => found[index]?.status === 'rejected')).toStrictEqual([]);
	});
});
