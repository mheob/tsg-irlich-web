import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { NoResults, type NoResultsContent } from './no-results';

type Links = NoResultsContent['links'];

function paragraph(text: string) {
	return {
		_key: 'p1',
		_type: 'block' as const,
		children: [{ _key: 's1', _type: 'span' as const, marks: [], text }],
		markDefs: [],
		style: 'normal' as const,
	};
}

function buildContent(overrides: Partial<NoResultsContent> = {}): NoResultsContent {
	return { links: [], title: 'Leider nichts gefunden', ...overrides };
}

const LINKS: Links = [
	{
		_key: 'offer',
		href: null,
		link: { _type: 'departmentsPage', category: null, department: null, slug: 'angebot' },
		linkType: 'internal',
		title: 'Unser Angebot',
	},
	{
		_key: 'group',
		href: null,
		link: { _type: 'group', category: null, department: 'tanzen', slug: 'diamonds' },
		linkType: 'internal',
		title: 'Diamonds',
	},
	{
		_key: 'city',
		href: 'https://www.neuwied.de',
		link: null,
		linkType: 'external',
		title: 'Stadt Neuwied',
	},
];

describe('the empty state of a search', () => {
	it('shows the title the editors wrote as a heading', () => {
		const { getByRole } = renderWithUser(<NoResults content={buildContent()} query="xyz" />);

		expect(getByRole('heading', { level: 2, name: 'Leider nichts gefunden' })).not.toBeNull();
	});

	it('shows the text of the editors', () => {
		const { getByText } = renderWithUser(
			<NoResults
				content={buildContent({
					text: {
						_type: 'simpleBlockContent',
						text: [paragraph('Versuch es mit einem kürzeren Begriff.')],
					},
				})}
				query="xyz"
			/>,
		);

		expect(getByText('Versuch es mit einem kürzeren Begriff.')).not.toBeNull();
	});

	it('links every target the way the navigation resolves it', () => {
		const { getByRole } = renderWithUser(
			<NoResults content={buildContent({ links: LINKS })} query="xyz" />,
		);

		expect(getByRole('link', { name: 'Unser Angebot' }).getAttribute('href')).toBe('/angebot');
		expect(getByRole('link', { name: 'Diamonds' }).getAttribute('href')).toBe(
			'/angebot/tanzen/diamonds',
		);
		expect(
			getByRole('link', { name: 'Stadt Neuwied (öffnet in neuem Tab)' }).getAttribute('href'),
		).toBe('https://www.neuwied.de');
	});

	it('opens an external link in a new tab', () => {
		const { getByRole } = renderWithUser(
			<NoResults content={buildContent({ links: LINKS })} query="xyz" />,
		);

		const external = getByRole('link', { name: /Stadt Neuwied/u });
		expect(external.getAttribute('target')).toBe('_blank');
		expect(external.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('keeps the links in the order of the editors', () => {
		const { getAllByRole } = renderWithUser(
			<NoResults content={buildContent({ links: LINKS })} query="xyz" />,
		);

		expect(getAllByRole('link').map((link) => link.getAttribute('href'))).toStrictEqual([
			'/angebot',
			'/angebot/tanzen/diamonds',
			'https://www.neuwied.de',
		]);
	});

	it('leaves out a link without a title or a target', () => {
		const { getAllByRole } = renderWithUser(
			<NoResults
				content={buildContent({
					links: [
						{
							_key: 'gone',
							href: null,
							link: null,
							linkType: 'internal',
							title: 'Gelöschte Seite',
						},
						{
							_key: 'nocategory',
							href: null,
							link: { _type: 'news.article', category: null, department: null, slug: 'bericht' },
							linkType: 'internal',
							title: 'Ohne Kategorie',
						},
						{
							_key: 'notitle',
							href: null,
							link: { _type: 'contact', category: null, department: null, slug: 'kontakt' },
							linkType: 'internal',
							title: '',
						},
						...LINKS.slice(0, 1),
					],
				})}
				query="xyz"
			/>,
		);

		expect(getAllByRole('link').map((link) => link.textContent)).toStrictEqual(['Unser Angebot']);
	});

	it('shows no list of links without one', () => {
		const { queryByRole } = renderWithUser(<NoResults content={buildContent()} query="xyz" />);

		expect(queryByRole('list')).toBeNull();
	});

	it('names the search term itself while the singleton is missing', () => {
		const { getByRole, queryByRole } = renderWithUser(<NoResults query="xyz" />);

		expect(getByRole('heading', { level: 2, name: 'Keine Treffer für „xyz“' })).not.toBeNull();
		expect(queryByRole('list')).toBeNull();
	});

	it('names the search term itself when the editors left the title blank', () => {
		const { getByRole } = renderWithUser(
			<NoResults content={buildContent({ title: '  ' })} query="xyz" />,
		);

		expect(getByRole('heading', { level: 2, name: 'Keine Treffer für „xyz“' })).not.toBeNull();
	});

	it('names the search term itself when a published document has no title at all', () => {
		const { getByRole } = renderWithUser(<NoResults content={{ links: LINKS }} query="xyz" />);

		expect(getByRole('heading', { level: 2, name: 'Keine Treffer für „xyz“' })).not.toBeNull();
		expect(getByRole('link', { name: 'Unser Angebot' })).not.toBeNull();
	});

	it('shows no links for a published document that has none', () => {
		const { queryByRole } = renderWithUser(
			<NoResults content={{ title: 'Leider nichts' }} query="xyz" />,
		);

		expect(queryByRole('list')).toBeNull();
	});
});
