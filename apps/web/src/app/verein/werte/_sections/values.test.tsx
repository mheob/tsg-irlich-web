import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { ClubValue, ValuesSection } from '../_shared/types';
import { Values } from './values';

function buildValue(title: string, overrides: Partial<ClubValue> = {}): ClubValue {
	return {
		_key: `key-${title}`,
		_type: 'clubValue',
		icon: 'heart',
		text: {
			_type: 'simpleBlockContent',
			text: [
				{
					_key: `${title}-block`,
					_type: 'block',
					children: [{ _key: `${title}-span`, _type: 'span', marks: [], text: `Text zu ${title}` }],
					markDefs: [],
					style: 'normal',
				},
			],
		},
		title,
		...overrides,
	};
}

function buildSection(values: ClubValue[]): ValuesSection {
	return { tocTitle: 'Inhalt', values };
}

const VALUES = [
	buildValue('Sportverein für alle', { teaser: 'Sport für die ganze Familie.' }),
	buildValue('Vielfalt', { quote: 'Wir glauben an die verbindende Kraft des Sports!' }),
	buildValue('Gesellschaftliche Verantwortung', {
		highlights: ['Teamgeist', 'Hilfsbereitschaft', 'Respekt', 'Gemeinschaft'],
	}),
];

describe('the values section of the values page', () => {
	it('heads every value with an h2 and shows its core statement and text', () => {
		const { getByRole, getByText } = renderWithUser(<Values section={buildSection(VALUES)} />);

		expect(getByRole('heading', { level: 2, name: 'Sportverein für alle' })).not.toBeNull();
		expect(
			getByRole('heading', { level: 2, name: 'Gesellschaftliche Verantwortung' }),
		).not.toBeNull();
		expect(getByText('Sport für die ganze Familie.')).not.toBeNull();
		expect(getByText('Text zu Vielfalt')).not.toBeNull();
	});

	it('names the table of contents after its heading and links every value by its anchor', () => {
		const { container, getByRole } = renderWithUser(<Values section={buildSection(VALUES)} />);

		const links = [...getByRole('navigation', { name: 'Inhalt' }).querySelectorAll('a')];

		expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toStrictEqual([
			['01Sportverein für alle', '#wert-sportverein-fuer-alle'],
			['02Vielfalt', '#wert-vielfalt'],
			['03Gesellschaftliche Verantwortung', '#wert-gesellschaftliche-verantwortung'],
		]);
		expect(container.querySelector('#wert-vielfalt')?.tagName).toBe('ARTICLE');
	});

	it('hides the numbers from screen readers, so a link is named by its title', () => {
		const { getByRole } = renderWithUser(<Values section={buildSection(VALUES)} />);

		expect(getByRole('link', { name: 'Vielfalt' })).not.toBeNull();
	});

	it('puts the quote of a value right after it', () => {
		const { container } = renderWithUser(<Values section={buildSection(VALUES)} />);

		const quote = container.querySelector('blockquote');

		expect(quote?.textContent).toBe('„Wir glauben an die verbindende Kraft des Sports!“');
		expect(quote?.closest('figure')?.previousElementSibling?.id).toBe('wert-vielfalt');
	});

	it('lists the highlights of a value, named after it', () => {
		const { getByRole } = renderWithUser(<Values section={buildSection(VALUES)} />);

		const list = getByRole('list', { name: 'Schlagworte Gesellschaftliche Verantwortung' });

		expect([...list.querySelectorAll('li')].map((item) => item.textContent)).toStrictEqual([
			'Teamgeist',
			'Hilfsbereitschaft',
			'Respekt',
			'Gemeinschaft',
		]);
	});

	it('leaves out what a value does not have', () => {
		const { container, queryByRole } = renderWithUser(
			<Values
				section={buildSection([buildValue('Ehrenamt', { text: { _type: 'simpleBlockContent' } })])}
			/>,
		);

		expect(container.querySelector('blockquote')).toBeNull();
		expect(queryByRole('list', { name: /Schlagworte/u })).toBeNull();
		expect(container.querySelector('#wert-ehrenamt p')).toBeNull();
	});

	it('renders nothing without values', () => {
		const { container } = renderWithUser(<Values section={buildSection([])} />);

		expect(container.innerHTML).toBe('');
	});
});
