import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { JoinSection } from '../_shared/types';
import { Join } from './join';

type JoinLink = JoinSection['links'][number];

const MEMBERSHIP: JoinLink = {
	_key: 'membership',
	href: null,
	link: { _type: 'membership', category: null, department: null, slug: 'mitgliedschaft' },
	linkType: 'internal',
	title: 'Mitglied werden',
};

const VOLUNTEER: JoinLink = {
	_key: 'volunteer',
	href: null,
	link: { _type: 'volunteerPage', category: null, department: null, slug: 'ehrenamt' },
	linkType: 'internal',
	title: 'Ehrenamt entdecken',
};

function buildSection(overrides: Partial<JoinSection> = {}): JoinSection {
	return {
		links: [MEMBERSHIP, VOLUNTEER],
		text: 'Mach mit – als Mitglied oder im Ehrenamt.',
		title: 'Werte leben – mach mit!',
		...overrides,
	};
}

describe('the closing section of the values page', () => {
	it('shows its title and text', () => {
		const { getByRole, getByText } = renderWithUser(<Join section={buildSection()} />);

		expect(getByRole('heading', { level: 2, name: 'Werte leben – mach mit!' })).not.toBeNull();
		expect(getByText('Mach mit – als Mitglied oder im Ehrenamt.')).not.toBeNull();
	});

	it('links the pages of its buttons in the order of the editors', () => {
		const { getAllByRole } = renderWithUser(<Join section={buildSection()} />);

		expect(
			getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')]),
		).toStrictEqual([
			['Mitglied werden', '/mitgliedschaft'],
			['Ehrenamt entdecken', '/verein/ehrenamt'],
		]);
	});

	it('opens an external button in a new tab', () => {
		const external: JoinLink = {
			_key: 'city',
			href: 'https://www.neuwied.de',
			link: null,
			linkType: 'external',
			title: 'Stadt Neuwied',
		};
		const { getByRole } = renderWithUser(<Join section={buildSection({ links: [external] })} />);

		const link = getByRole('link', { name: 'Stadt Neuwied' });

		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('leaves out a button whose page is gone', () => {
		const { getAllByRole } = renderWithUser(
			<Join section={buildSection({ links: [{ ...MEMBERSHIP, link: null }, VOLUNTEER] })} />,
		);

		expect(getAllByRole('link').map((link) => link.textContent)).toStrictEqual([
			'Ehrenamt entdecken',
		]);
	});

	it('shows title and text without any button', () => {
		const { getByRole, queryByRole } = renderWithUser(
			<Join section={buildSection({ links: [], text: undefined })} />,
		);

		expect(getByRole('heading', { level: 2 })).not.toBeNull();
		expect(queryByRole('link')).toBeNull();
	});

	it('renders nothing without a title', () => {
		const { container } = renderWithUser(<Join section={buildSection({ title: '' })} />);

		expect(container.innerHTML).toBe('');
	});
});
