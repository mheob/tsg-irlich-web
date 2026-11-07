import { within } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { setPathname } from '../../../test-utils/setup-dom';
import { encodeLikeDraftMode } from '../../../test-utils/stega';
import { Hero } from './hero';

const DEPARTMENT_DOCUMENT = { _id: 'department-fussball', _type: 'department' };
const GROUP_DOCUMENT = { _id: 'group-1-mannschaft', _type: 'group' };

/**
 * Reads the names of the breadcrumb's structured data.
 *
 * @param container - The rendered hero.
 * @returns The name of every item, from the home page down.
 */
function readSchemaNames(container: HTMLElement): string[] {
	const script = container.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
	const schema = JSON.parse(String(script?.text)) as { itemListElement: { name: string }[] };

	return schema.itemListElement.map((item) => item.name);
}

describe('the hero of a page', () => {
	it('heads the page with its title', () => {
		const { getAllByRole, getByRole } = renderWithUser(
			<Hero subTitle="So erreichst du uns" title="Kontakt" />,
		);

		expect(getByRole('heading', { level: 1, name: 'Kontakt' })).not.toBeNull();
		expect(getAllByRole('heading')).toHaveLength(1);
	});

	it('shows its title as plain text when the content below heads the page', () => {
		const { getByText, queryAllByRole } = renderWithUser(
			<Hero isTitleHeading={false} subTitle="Abteilungen" title="Angebote" />,
		);

		expect(queryAllByRole('heading')).toStrictEqual([]);
		expect(getByText('Angebote')).not.toBeNull();
	});

	it('shows the image by its alt text', () => {
		const { getByRole } = renderWithUser(
			<Hero image={{ alt: 'Ein Büro', src: 'https://cdn.sanity.io/hero.webp' }} title="Kontakt" />,
		);

		expect(getByRole('img', { name: 'Ein Büro' }).getAttribute('src')).toBe(
			'https://cdn.sanity.io/hero.webp',
		);
	});

	it('loads the image at once and with high priority, as the largest paint of the page', () => {
		const { getByRole } = renderWithUser(
			<Hero image={{ alt: 'Ein Büro', src: 'https://cdn.sanity.io/hero.webp' }} title="Kontakt" />,
		);

		const image = getByRole('img', { name: 'Ein Büro' });
		expect(image.getAttribute('loading')).toBe('eager');
		expect(image.getAttribute('fetchpriority')).toBe('high');
	});

	it('positions the image at the hotspot it is given', () => {
		const { getByRole } = renderWithUser(
			<Hero
				image={{
					alt: 'Ein Büro',
					objectPosition: '25% 75%',
					src: 'https://cdn.sanity.io/hero.webp',
				}}
				title="Kontakt"
			/>,
		);

		expect((getByRole('img', { name: 'Ein Büro' }) as HTMLImageElement).style.objectPosition).toBe(
			'25% 75%',
		);
	});

	it('shows no image without one', () => {
		const { queryByRole } = renderWithUser(<Hero title="Kontakt" />);

		expect(queryByRole('img')).toBeNull();
	});

	describe('breadcrumb', () => {
		it('ends in the title of the hero', () => {
			setPathname('/kontakt');
			const { getByRole } = renderWithUser(<Hero title="Kontakt" />);

			const nav = getByRole('navigation', { name: 'Breadcrumb' });

			expect(within(nav).getByText('Kontakt').getAttribute('aria-current')).toBe('page');
		});

		it('ends in the title of the page instead of a generic hero title, below the parents it names', () => {
			setPathname('/angebot/fussball/1-mannschaft');
			const { container, getByRole } = renderWithUser(
				<Hero
					breadcrumb={{ page: '1. Mannschaft', parents: { '/angebot/fussball': 'Fußball' } }}
					isTitleHeading={false}
					title="Angebote"
				/>,
			);

			const nav = getByRole('navigation', { name: 'Breadcrumb' });

			expect(within(nav).getByRole('link', { name: 'Fußball' }).getAttribute('href')).toBe(
				'/angebot/fussball',
			);
			expect(within(nav).getByText('1. Mannschaft').getAttribute('aria-current')).toBe('page');
			expect(within(nav).queryByText('Angebote')).toBeNull();
			expect(readSchemaNames(container)).toStrictEqual([
				'Home',
				'Angebot',
				'Fußball',
				'1. Mannschaft',
			]);
		});

		it('keeps the stega encoding out of the structured data, and on the visible trail', () => {
			setPathname('/angebot/fussball/1-mannschaft');
			const department = encodeLikeDraftMode('Fußball', DEPARTMENT_DOCUMENT);
			const group = encodeLikeDraftMode('1. Mannschaft', GROUP_DOCUMENT);
			const { container, getByRole } = renderWithUser(
				<Hero
					breadcrumb={{ page: group, parents: { '/angebot/fussball': department } }}
					title={encodeLikeDraftMode('Angebote', {
						_id: 'singleGroupPage',
						_type: 'singleGroupPage',
					})}
				/>,
			);

			const nav = getByRole('navigation', { name: 'Breadcrumb' });

			expect(readSchemaNames(container)).toStrictEqual([
				'Home',
				'Angebot',
				'Fußball',
				'1. Mannschaft',
			]);
			const links = within(nav).getAllByRole('link');

			// The text itself, which carries the invisible characters the overlays read.
			expect(links.at(-1)?.getAttribute('href')).toBe('/angebot/fussball');
			expect(links.at(-1)?.textContent).toBe(department);
			expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe(group);
		});
	});
});
