import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

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

	describe.each([false, true])('with link props, compact: %s', (compact) => {
		const linkProps = {
			'aria-selected': true,
			id: 'search-option-1',
			role: 'option',
			tabIndex: -1,
		} as const;

		it('turns its own title link into the option, with the given attributes', () => {
			const { getByRole } = renderWithUser(
				<SearchHitRow
					hit={buildHit()}
					linkProps={linkProps}
					words={['diamond']}
					compact={compact}
				/>,
			);

			const option = getByRole('option', { name: 'Diamonds glänzen nochmal' });
			expect(option.id).toBe('search-option-1');
			expect(option.getAttribute('aria-selected')).toBe('true');
			expect(option.getAttribute('tabindex')).toBe('-1');
			expect(option.getAttribute('href')).toBe('/news/breitensport/session-abschluss');
		});

		it('holds no second link next to the option, so no anchor is nested', () => {
			const { container, getAllByRole, queryAllByRole } = renderWithUser(
				<SearchHitRow
					hit={buildHit()}
					linkProps={linkProps}
					words={['diamond']}
					compact={compact}
				/>,
			);

			expect(getAllByRole('option')).toHaveLength(1);
			expect(queryAllByRole('link')).toHaveLength(0);
			expect(container.querySelectorAll('a')).toHaveLength(1);
		});

		// An option has to sit in its listbox or group with nothing but generic elements in
		// between. An `article` or a heading there is a role of its own (axe: aria-required-parent).
		it('leaves the article and the heading out, so the option belongs to the group around the row', () => {
			const { queryByRole } = renderWithUser(
				<SearchHitRow
					hit={buildHit()}
					linkProps={linkProps}
					words={['diamond']}
					compact={compact}
				/>,
			);

			expect(queryByRole('article')).toBeNull();
			expect(queryByRole('heading')).toBeNull();
		});

		// The option is named by the title alone. A screen reader that moves through the listbox
		// only reads the option, so the meta line and the snippet travel as its description.
		it('describes the option by its meta line and its snippet', () => {
			const { getByRole } = renderWithUser(
				<SearchHitRow
					hit={buildHit()}
					linkProps={linkProps}
					words={['diamond']}
					compact={compact}
				/>,
			);

			const descriptionIds = String(getByRole('option').getAttribute('aria-describedby')).split(
				' ',
			);
			expect(
				descriptionIds.map((id) => document.querySelector(`[id="${id}"]`)?.textContent),
			).toStrictEqual(['01.03.2026 · Breitensport', SNIPPET]);
		});

		it('describes the option by its meta line alone when the hit has no snippet', () => {
			const { getByRole } = renderWithUser(
				<SearchHitRow
					hit={buildHit({ snippet: undefined })}
					linkProps={linkProps}
					words={['diamond']}
					compact={compact}
				/>,
			);

			const descriptionId = String(getByRole('option').getAttribute('aria-describedby'));
			expect(document.querySelector(`[id="${descriptionId}"]`)?.textContent).toBe(
				'01.03.2026 · Breitensport',
			);
		});

		it('hands a click on the option to the given handler', async () => {
			const onClick = vi.fn((event: MouseEvent<HTMLAnchorElement>) => {
				// jsdom cannot follow the link.
				event.preventDefault();
			});
			const { getByRole, user } = renderWithUser(
				<SearchHitRow
					hit={buildHit()}
					linkProps={{ ...linkProps, onClick }}
					words={['diamond']}
					compact={compact}
				/>,
			);

			await user.click(getByRole('option'));

			expect(onClick).toHaveBeenCalledOnce();
		});
	});

	it('renders a plain link in an article without link props', () => {
		const { container, getByRole, queryByRole } = renderWithUser(
			<SearchHitRow hit={buildHit()} words={['diamond']} />,
		);

		expect(queryByRole('option')).toBeNull();
		expect(getByRole('article')).not.toBeNull();
		expect(container.querySelector('a')?.getAttribute('id')).toBeNull();
		expect(container.querySelector('a')?.getAttribute('aria-describedby')).toBeNull();
	});

	describe('in its compact form', () => {
		it('shows the person line of a person-derived hit after the meta line, with its matches marked', () => {
			const { container, getByText } = renderWithUser(
				<SearchHitRow
					hit={buildHit({
						meta: 'Gruppe · Tanzen',
						snippet: 'Ansprechperson: Alina Kaap, Übungsleiterin',
						title: 'Funky Diamonds',
					})}
					words={['kaap']}
					compact
				/>,
			);

			// Title, meta line, then the person line.
			expect(container.textContent).toBe(
				'Funky DiamondsGruppe · TanzenAnsprechperson: Alina Kaap, Übungsleiterin',
			);
			expect(getByText('Kaap', { selector: 'mark' }).parentElement?.textContent).toBe(
				'Ansprechperson: Alina Kaap, Übungsleiterin',
			);
		});

		it('renders only the title and the meta line for a hit without a snippet', () => {
			const { container } = renderWithUser(
				<SearchHitRow hit={buildHit({ snippet: undefined })} words={['diamond']} compact />,
			);

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
