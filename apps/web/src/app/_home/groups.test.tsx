import { describe, expect, it } from 'vite-plus/test';

import type { DepartmentCardsQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { Groups } from './groups';

const CARD_IMAGE = { _type: 'extendedImage', alt: 'Bild' } as const;

type Department = DepartmentCardsQueryResult[number];

function department(
	slug: string,
	title: string,
	icon: Department['icon'] = 'Fussball',
): Department {
	return { _id: `department-${slug}`, cardImage: CARD_IMAGE, icon, slug, title };
}

function renderGroups(departments: DepartmentCardsQueryResult) {
	return renderWithUser(
		<Groups departments={departments} subtitle="Sport" title="Unsere Abteilungen" />,
	);
}

describe('the groups section of the home page', () => {
	it('links every department to its page, in query order', () => {
		const { getAllByRole } = renderGroups([
			department('tanzen', 'Tanzen', 'Tanzen'),
			department('fussball', 'Fußball'),
		]);

		expect(
			getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')]),
		).toStrictEqual([
			['01Tanzen', '/angebot/tanzen'],
			['02Fußball', '/angebot/fussball'],
		]);
	});

	it('numbers the departments without a gap when one has no slug', () => {
		const { getAllByRole } = renderGroups([
			department('tanzen', 'Tanzen', 'Tanzen'),
			department('', 'Ohne Adresse'),
			department('fussball', 'Fußball'),
		]);

		expect(getAllByRole('link').map((link) => link.textContent)).toStrictEqual([
			'01Tanzen',
			'02Fußball',
		]);
	});

	it('shows no picture of a department', () => {
		const { queryAllByRole } = renderGroups([department('fussball', 'Fußball')]);

		expect(queryAllByRole('img')).toStrictEqual([]);
	});
});
