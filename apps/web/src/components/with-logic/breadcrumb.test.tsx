import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { setPathname } from '../../../test-utils/setup-dom';
import Breadcrumb from './breadcrumb';

const BASE_URL = 'https://www.tsg-irlich.de';

describe('breadcrumb', () => {
	it('renders the home link, one link per pathname segment before the last, and the current page as plain text', () => {
		setPathname('/verein/vorstand-team');
		const { getByRole, getByText } = renderWithUser(
			<Breadcrumb baseUrl={BASE_URL} currentPage="Der Vorstand" />,
		);

		const nav = getByRole('navigation', { name: 'Breadcrumb' });
		const links = within(nav).getAllByRole('link');

		expect(links.map((link) => [link.getAttribute('href'), link.textContent])).toStrictEqual([
			['/', 'Home'],
			['/verein', 'Verein'],
		]);
		expect(within(nav).queryByRole('link', { name: 'Der Vorstand' })).toBeNull();
		expect(getByText('Der Vorstand')).not.toBeNull();
	});

	it('leaves the last segment of a three-segment pathname out of the links', () => {
		setPathname('/a/b/c');
		const { getByRole } = renderWithUser(
			<Breadcrumb baseUrl={BASE_URL} currentPage="Current Page" />,
		);

		const nav = getByRole('navigation', { name: 'Breadcrumb' });
		const links = within(nav).getAllByRole('link');

		expect(links.map((link) => [link.getAttribute('href'), link.textContent])).toStrictEqual([
			['/', 'Home'],
			['/a', 'A'],
			['/a/b', 'B'],
		]);
		expect(within(nav).queryByRole('link', { name: /c/iu })).toBeNull();
	});

	it('links every parent segment to the path up to it, however deep the page sits', () => {
		setPathname('/a/b/c/d');
		const { getByRole } = renderWithUser(
			<Breadcrumb baseUrl={BASE_URL} currentPage="Current Page" />,
		);

		const nav = getByRole('navigation', { name: 'Breadcrumb' });
		const links = within(nav).getAllByRole('link');

		expect(links.map((link) => [link.getAttribute('href'), link.textContent])).toStrictEqual([
			['/', 'Home'],
			['/a', 'A'],
			['/a/b', 'B'],
			['/a/b/c', 'C'],
		]);
	});

	it('humanises a hyphenated, mixed-case segment into title-cased words', () => {
		setPathname('/MEIN-Verein/team');
		const { getByRole } = renderWithUser(
			<Breadcrumb baseUrl={BASE_URL} currentPage="Teamübersicht" />,
		);

		const nav = getByRole('navigation', { name: 'Breadcrumb' });

		expect(within(nav).getByRole('link', { name: 'Mein Verein' })).not.toBeNull();
	});

	it('marks the current page as programmatically identifiable through aria-current, regardless of its class-only styling', () => {
		setPathname('/verein/vorstand-team');
		const { getByText } = renderWithUser(
			<Breadcrumb baseUrl={BASE_URL} currentPage="Der Vorstand" />,
		);

		expect(getByText('Der Vorstand').getAttribute('aria-current')).toBe('page');
	});

	it('names the current page after its own segment when no title is given', () => {
		setPathname('/verein/vorstand-team');
		const { getByText } = renderWithUser(<Breadcrumb baseUrl={BASE_URL} />);

		expect(getByText('Vorstand Team').getAttribute('aria-current')).toBe('page');
	});

	it('describes the trail as structured data with absolute links', () => {
		setPathname('/verein/vorstand-team');
		const { container } = renderWithUser(
			<Breadcrumb baseUrl={BASE_URL} currentPage="Der Vorstand" />,
		);

		const script = container.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');

		expect(JSON.parse(String(script?.text))).toMatchObject({
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ item: 'https://www.tsg-irlich.de/', name: 'Home', position: 1 },
				{ item: 'https://www.tsg-irlich.de/verein', name: 'Verein', position: 2 },
				{
					item: 'https://www.tsg-irlich.de/verein/vorstand-team',
					name: 'Der Vorstand',
					position: 3,
				},
			],
		});
	});
});
