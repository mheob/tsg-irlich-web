import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { GalleryImage } from '@/utils/image';

import { renderWithUser } from '../../../test-utils/render';
import { Gallery } from './gallery';

function buildImages(count: number): GalleryImage[] {
	return Array.from({ length: count }, (_unused, index) => ({
		alt: `Bild ${index + 1}`,
		key: `image-${index + 1}`,
		src: `/thumb/${index + 1}.jpg`,
		srcFull: `/full/${index + 1}.jpg`,
	}));
}

function renderGallery(images: GalleryImage[]) {
	return renderWithUser(<Gallery images={images} />);
}

describe('gallery', () => {
	it('renders one thumbnail per image, each queryable by its alt text', () => {
		const images = buildImages(4);
		const { getByRole } = renderGallery(images);

		for (const image of images) {
			expect(getByRole('img', { name: image.alt })).not.toBeNull();
		}
	});

	it('opens the lightbox on the first image when its thumbnail is clicked', async () => {
		const images = buildImages(2);
		const { findByRole, getByRole, user } = renderGallery(images);

		await user.click(getByRole('button', { name: 'Bild 1 vergrößern' }));

		const dialog = await findByRole('dialog', { name: 'Bild 1' });
		expect(within(dialog).getByRole('img', { name: 'Bild 1' })).not.toBeNull();
	});

	it('opens the lightbox on the third image, not a shifted one, in the three-image bespoke layout', async () => {
		const images = buildImages(3);
		const { findByRole, getByRole, user } = renderGallery(images);

		await user.click(getByRole('button', { name: 'Bild 3 vergrößern' }));

		const dialog = await findByRole('dialog', { name: 'Bild 3' });
		expect(within(dialog).getByRole('img', { name: 'Bild 3' })).not.toBeNull();
	});

	it('opens the lightbox on the second image, not a shifted one, in the three-image bespoke layout', async () => {
		const images = buildImages(3);
		const { findByRole, getByRole, user } = renderGallery(images);

		await user.click(getByRole('button', { name: 'Bild 2 vergrößern' }));

		const dialog = await findByRole('dialog', { name: 'Bild 2' });
		expect(within(dialog).getByRole('img', { name: 'Bild 2' })).not.toBeNull();
	});

	it('opens the lightbox on the only image in the single-image layout', async () => {
		const images = buildImages(1);
		const { findByRole, getByRole, user } = renderGallery(images);

		await user.click(getByRole('button', { name: 'Bild 1 vergrößern' }));

		const dialog = await findByRole('dialog', { name: 'Bild 1' });
		expect(within(dialog).getByRole('img', { name: 'Bild 1' })).not.toBeNull();
	});

	it('opens the lightbox on the image belonging to the clicked thumbnail in the grid layout for more than three images', async () => {
		const images = buildImages(5);
		const { findByRole, getByRole, user } = renderGallery(images);

		await user.click(getByRole('button', { name: 'Bild 4 vergrößern' }));

		const dialog = await findByRole('dialog', { name: 'Bild 4' });
		expect(within(dialog).getByRole('img', { name: 'Bild 4' })).not.toBeNull();
	});

	it('renders the thumbnails in the same order as the input images, in the grid layout for more than three images', () => {
		const images = buildImages(5);
		const { getAllByRole } = renderGallery(images);

		const names = getAllByRole('img').map((image) => image.getAttribute('alt'));

		expect(names).toStrictEqual(['Bild 1', 'Bild 2', 'Bild 3', 'Bild 4', 'Bild 5']);
	});

	it('gives each trigger in the grid layout for more than three images the accessible name of the image nested inside it', () => {
		const images = buildImages(5);
		const { getAllByRole } = renderGallery(images);

		const triggers = getAllByRole('button', { name: /vergrößern$/u });

		for (const trigger of triggers) {
			const alt = within(trigger).getByRole('img').getAttribute('alt');
			expect(trigger.getAttribute('aria-label')).toBe(`${alt} vergrößern`);
		}
	});

	it('renders nothing for an empty image list', () => {
		const images = buildImages(0);
		const { container } = render(<Gallery images={images} />);

		expect(container.firstChild).toBeNull();
	});
});
