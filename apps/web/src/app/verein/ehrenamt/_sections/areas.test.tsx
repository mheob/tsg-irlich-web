import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { AreasSection } from '../_shared/types';
import { Areas } from './areas';

type Area = NonNullable<AreasSection['areas']>[number];

function buildArea(title: string, overrides: Partial<Area> = {}): Area {
	return {
		_key: title,
		_type: 'volunteerArea',
		icon: 'flag',
		image: {
			_type: 'extendedImage',
			alt: `Bild ${title}`,
			asset: { _ref: `image-${title.length}abc-1200x900-jpg`, _type: 'reference' },
		},
		tasks: [`Aufgabe in ${title}`],
		text: `Text zu ${title}`,
		title,
		...overrides,
	};
}

function buildSection(areas: Area[]): AreasSection {
	return {
		areas,
		intro: 'Jeder Beitrag zählt.',
		subtitle: 'Viele Aufgaben – ein Ziel',
		title: 'So kannst du dich einbringen',
	};
}

const FOUR_AREAS = ['Sport', 'Schiri', 'Verein', 'Feste'].map((title) => buildArea(title));

describe('the areas section of the volunteer page', () => {
	it('shows the header and title and text of every area', () => {
		const { getByRole, getByText } = renderWithUser(<Areas section={buildSection(FOUR_AREAS)} />);

		expect(getByRole('heading', { level: 2, name: 'So kannst du dich einbringen' })).not.toBeNull();
		expect(getByRole('heading', { level: 3, name: 'Verein' })).not.toBeNull();
		expect(getByText('Text zu Verein')).not.toBeNull();
	});

	it('numbers the areas with two digits in their order, hidden from screen readers', () => {
		const { getByText } = renderWithUser(<Areas section={buildSection(FOUR_AREAS)} />);

		for (const digits of ['01', '02', '03', '04']) {
			expect(getByText(digits).getAttribute('aria-hidden')).toBe('true');
		}
	});

	it('lists the example tasks of an area', () => {
		const { getByRole } = renderWithUser(<Areas section={buildSection(FOUR_AREAS)} />);

		expect(getByRole('list', { name: 'Beispielaufgaben Sport' }).textContent).toBe(
			'Aufgabe in Sport',
		);
	});

	it('leaves the task list out of an area without tasks', () => {
		const { queryByRole } = renderWithUser(
			<Areas section={buildSection([buildArea('Sport', { tasks: [] })])} />,
		);

		expect(queryByRole('list', { name: 'Beispielaufgaben Sport' })).toBeNull();
	});

	it('uses the alt text of the image', () => {
		const { getByAltText } = renderWithUser(<Areas section={buildSection(FOUR_AREAS)} />);

		expect(getByAltText('Bild Sport')).not.toBeNull();
	});

	it('shows an area without image file without an image', () => {
		const { getByRole, queryByRole } = renderWithUser(
			<Areas
				section={buildSection([
					buildArea('Sport', { image: { _type: 'extendedImage', alt: 'Bild Sport' } }),
				])}
			/>,
		);

		expect(queryByRole('img')).toBeNull();
		expect(getByRole('heading', { level: 3, name: 'Sport' })).not.toBeNull();
	});

	it('leaves the section out without areas', () => {
		const { container } = renderWithUser(<Areas section={buildSection([])} />);

		expect(container.innerHTML).toBe('');
	});
});
