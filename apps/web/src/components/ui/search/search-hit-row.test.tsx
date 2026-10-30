import { describe, expect, it } from 'vite-plus/test';

import type { SearchHit } from '@/lib/search/types';

import { renderWithUser } from '../../../../test-utils/render';
import { SearchHitRow } from './search-hit-row';

const SNIPPET = 'Die Mädchen tanzen zum Abschluss.';

function buildHit(overrides: Partial<SearchHit> = {}): SearchHit {
	return {
		href: '/news/breitensport/session-abschluss',
		id: 'news-session-abschluss',
		kind: 'news',
		meta: '01.03.2026 · Breitensport',
		score: 10,
		snippet: SNIPPET,
		thumbnail: { src: 'https://cdn.sanity.io/images/x/y/news.jpg?w=480&h=270', unoptimized: false },
		title: 'Diamonds glänzen nochmal',
		...overrides,
	};
}

describe('the row of a hit', () => {
	it('links to the hit under the plain text of its title', () => {
		const { getByRole } = renderWithUser(
			<SearchHitRow hit={buildHit()} words={['diamond', 'tanz']} />,
		);

		// The mark inside the title does not change the name.
		const link = getByRole('link', { name: 'Diamonds glänzen nochmal' });
		expect(link.getAttribute('href')).toBe('/news/breitensport/session-abschluss');
	});

	it('marks the matched prefix in the title', () => {
		const { getByRole } = renderWithUser(
			<SearchHitRow hit={buildHit()} words={['diamond', 'tanz']} />,
		);

		const marks = getByRole('link').querySelectorAll('mark');
		expect([...marks].map((mark) => mark.textContent)).toStrictEqual(['Diamond']);
	});

	it('shows the meta line and the snippet with its matches marked', () => {
		const { getByText } = renderWithUser(
			<SearchHitRow hit={buildHit()} words={['diamond', 'tanz']} />,
		);

		expect(getByText('01.03.2026 · Breitensport')).not.toBeNull();
		// The title's match is "Diamond", the snippet's is "tanz".
		const match = getByText('tanz', { selector: 'mark' });
		expect(match.parentElement?.textContent).toBe(SNIPPET);
	});

	it('names the row with the title as a heading', () => {
		const { getByRole } = renderWithUser(
			<SearchHitRow hit={buildHit()} words={['diamond', 'tanz']} />,
		);

		expect(getByRole('heading', { level: 3, name: 'Diamonds glänzen nochmal' })).not.toBeNull();
	});

	it('reads the meta line, the title and the snippet in this order', () => {
		const { container } = renderWithUser(
			<SearchHitRow hit={buildHit()} words={['diamond', 'tanz']} />,
		);

		expect(container.textContent).toBe(
			`01.03.2026 · BreitensportDiamonds glänzen nochmal${SNIPPET}`,
		);
	});

	it('shows the image of the hit without an alternative text', () => {
		const { container } = renderWithUser(
			<SearchHitRow hit={buildHit()} words={['diamond', 'tanz']} />,
		);

		const image = container.querySelector('img');
		expect(image?.getAttribute('src')).toBe(
			'https://cdn.sanity.io/images/x/y/news.jpg?w=480&h=270',
		);
		expect(image?.getAttribute('alt')).toBe('');
	});

	it('still renders its title, meta and snippet without an image', () => {
		const { container, getByRole, getByText } = renderWithUser(
			<SearchHitRow hit={buildHit({ thumbnail: null })} words={['diamond', 'tanz']} />,
		);

		expect(container.querySelector('img[src]')).toBeNull();
		expect(getByRole('link', { name: 'Diamonds glänzen nochmal' })).not.toBeNull();
		expect(getByText('01.03.2026 · Breitensport')).not.toBeNull();
		expect(container.textContent).toContain(SNIPPET);
	});

	describe('in its compact form', () => {
		it('renders no snippet', () => {
			const { container } = renderWithUser(
				<SearchHitRow hit={buildHit()} words={['diamond', 'tanz']} compact />,
			);

			// The title comes first and the snippet is gone.
			expect(container.textContent).toBe('Diamonds glänzen nochmal01.03.2026 · Breitensport');
		});

		it('still links to the hit under the plain text of its title', () => {
			const { getByRole } = renderWithUser(
				<SearchHitRow hit={buildHit()} words={['diamond', 'tanz']} compact />,
			);

			const link = getByRole('link', { name: 'Diamonds glänzen nochmal' });
			expect(link.getAttribute('href')).toBe('/news/breitensport/session-abschluss');
			expect([...link.querySelectorAll('mark')].map((mark) => mark.textContent)).toStrictEqual([
				'Diamond',
			]);
		});

		it('still renders without an image', () => {
			const { container, getByRole } = renderWithUser(
				<SearchHitRow hit={buildHit({ thumbnail: null })} words={['diamond', 'tanz']} compact />,
			);

			expect(container.querySelector('img[src]')).toBeNull();
			expect(getByRole('link', { name: 'Diamonds glänzen nochmal' })).not.toBeNull();
		});
	});
});
