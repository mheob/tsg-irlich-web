import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { Hero } from './hero';

describe('the hero of a page', () => {
	it('heads the page with its title', () => {
		const { getByRole } = renderWithUser(<Hero subTitle="So erreichst du uns" title="Kontakt" />);

		expect(getByRole('heading', { name: 'Kontakt' })).not.toBeNull();
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
});
