import { describe, expect, it } from 'vite-plus/test';

import type { SearchHit } from '@/lib/search/types';

import { renderWithUser } from '../../../../test-utils/render';
import { SearchHitCard } from './search-hit-card';

function buildHit(overrides: Partial<SearchHit> = {}): SearchHit {
	return {
		href: '/angebot/tanzen',
		id: 'group-tanzen',
		kind: 'group',
		meta: 'Gruppe · Breitensport',
		score: 10,
		thumbnail: {
			src: 'https://cdn.sanity.io/images/x/y/tanzen.jpg?w=480&h=270',
			unoptimized: false,
		},
		title: 'Tanzen',
		...overrides,
	};
}

describe('the card of a page hit', () => {
	it('links to the hit under the plain text of its title', () => {
		const { getByRole } = renderWithUser(<SearchHitCard hit={buildHit()} words={['tanz']} />);

		// The mark inside the title does not change the name.
		const link = getByRole('link', { name: 'Tanzen' });
		expect(link.getAttribute('href')).toBe('/angebot/tanzen');
	});

	it('is the only link of the card, so the whole card goes to the hit', () => {
		const { getAllByRole } = renderWithUser(<SearchHitCard hit={buildHit()} words={['tanz']} />);

		expect(getAllByRole('link')).toHaveLength(1);
	});

	it('names the card with the title as a heading', () => {
		const { getByRole } = renderWithUser(<SearchHitCard hit={buildHit()} words={['tanz']} />);

		expect(getByRole('heading', { level: 3, name: 'Tanzen' })).not.toBeNull();
	});

	it('marks the matched prefix in the title', () => {
		const { getByRole } = renderWithUser(<SearchHitCard hit={buildHit()} words={['tanz']} />);

		const marks = getByRole('link').querySelectorAll('mark');
		expect([...marks].map((mark) => mark.textContent)).toStrictEqual(['Tanz']);
	});

	it('shows the meta line', () => {
		const { getByText } = renderWithUser(<SearchHitCard hit={buildHit()} words={['tanz']} />);

		expect(getByText('Gruppe · Breitensport')).not.toBeNull();
	});

	it('shows the snippet with its matches marked when the hit has one', () => {
		const { getByText } = renderWithUser(
			<SearchHitCard hit={buildHit({ snippet: 'Wir tanzen jeden Dienstag.' })} words={['tanz']} />,
		);

		// The title's match is "Tanz" with a capital, the snippet's is "tanz".
		const match = getByText('tanz', { selector: 'mark' });
		expect(match.parentElement?.textContent).toBe('Wir tanzen jeden Dienstag.');
	});

	it('shows no snippet when the hit has none', () => {
		const { container } = renderWithUser(<SearchHitCard hit={buildHit()} words={['tanz']} />);

		expect(container.textContent).toBe('TanzenGruppe · Breitensport');
	});

	it('shows the image of the hit without an alternative text', () => {
		const { container } = renderWithUser(<SearchHitCard hit={buildHit()} words={['tanz']} />);

		const image = container.querySelector('img');
		expect(image?.getAttribute('src')).toBe(
			'https://cdn.sanity.io/images/x/y/tanzen.jpg?w=480&h=270',
		);
		expect(image?.getAttribute('alt')).toBe('');
	});

	it('still renders its title and meta without an image', () => {
		const { container, getByRole, getByText } = renderWithUser(
			<SearchHitCard hit={buildHit({ thumbnail: null })} words={['tanz']} />,
		);

		expect(container.querySelector('img[src]')).toBeNull();
		expect(getByRole('link', { name: 'Tanzen' })).not.toBeNull();
		expect(getByText('Gruppe · Breitensport')).not.toBeNull();
	});
});
