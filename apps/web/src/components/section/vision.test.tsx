import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { Vision } from './vision';

const VISION_IMAGES = [
	{ alt: 'Scheck-Übergabe', src: 'https://cdn.sanity.io/vision-1.webp' },
	{ alt: 'Tanzgruppe auf der Bühne', src: 'https://cdn.sanity.io/vision-2.webp' },
	{ alt: 'Jugendmannschaft', src: 'https://cdn.sanity.io/vision-3.webp' },
];

function renderVision(images: Parameters<typeof Vision>[0]['images'] = VISION_IMAGES) {
	return renderWithUser(
		<Vision
			_type="home"
			cta="Mehr erfahren"
			images={images}
			intro="Sport verbindet."
			subtitle="Unsere Vision"
			title="Gemeinsam bewegen"
		/>,
	);
}

describe('the vision section', () => {
	it('shows the three images by their alt texts', () => {
		const { getAllByRole } = renderVision();

		expect(getAllByRole('img').map((image) => image.getAttribute('alt'))).toStrictEqual([
			'Scheck-Übergabe',
			'Tanzgruppe auf der Bühne',
			'Jugendmannschaft',
		]);
	});

	it('leaves out an image without a file and keeps the others in place', () => {
		const { getAllByRole } = renderVision([VISION_IMAGES[0], undefined, VISION_IMAGES[2]]);

		expect(getAllByRole('img').map((image) => image.getAttribute('src'))).toStrictEqual([
			'https://cdn.sanity.io/vision-1.webp',
			'https://cdn.sanity.io/vision-3.webp',
		]);
	});
});
