import { cleanup, within } from '@testing-library/react';
import Image from 'next/image';
import { afterEach, describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { LightboxGallery, LightboxTrigger } from './lightbox';
import type { LightboxImage } from './lightbox';

const FIRST_IMAGE: LightboxImage = { alt: 'Erstes Bild', key: 'first', srcFull: '/full/first.jpg' };

const THREE_IMAGES: LightboxImage[] = [
	FIRST_IMAGE,
	{
		alt: 'Zweites Bild',
		caption: 'Die Mannschaft beim Aufwärmen',
		key: 'second',
		srcFull: '/full/second.jpg',
	},
	{ alt: 'Drittes Bild', key: 'third', srcFull: '/full/third.jpg' },
];

function renderGallery(images: LightboxImage[]) {
	return renderWithUser(
		<LightboxGallery images={images}>
			{images.map((image, index) => (
				<LightboxTrigger index={index} key={image.key}>
					<Image
						alt={`${image.alt} Vorschau`}
						height={40}
						src={`/thumb/${image.key}.jpg`}
						width={40}
					/>
				</LightboxTrigger>
			))}
		</LightboxGallery>,
	);
}

describe('lightbox gallery', () => {
	// `renderWithUser` mounts straight into `document.body` and nothing in this file imports the
	// vitest globals, so Testing Library's own auto-cleanup (which only registers itself when it
	// finds a global `afterEach`) never runs — without this, the second test in the file would find
	// its trigger buttons duplicated by the first test's still-mounted tree.
	afterEach(() => {
		cleanup();
	});

	it('opens on the image belonging to the clicked trigger', async () => {
		const { findByRole, getByRole, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Erstes Bild vergrößern' }));

		const dialog = await findByRole('dialog', { name: 'Erstes Bild' });
		expect(within(dialog).getByRole('img', { name: 'Erstes Bild' })).not.toBeNull();
	});

	it('opens on the third image, not the first, when its trigger is clicked', async () => {
		const { findByRole, getByRole, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Drittes Bild vergrößern' }));

		const dialog = await findByRole('dialog', { name: 'Drittes Bild' });
		expect(within(dialog).getByRole('img', { name: 'Drittes Bild' })).not.toBeNull();
	});

	it('moves to the next and then back to the previous image with the paging controls', async () => {
		const { findByRole, getByRole, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Erstes Bild vergrößern' }));
		await findByRole('dialog', { name: 'Erstes Bild' });

		await user.click(getByRole('button', { name: 'Nächstes Bild' }));
		const secondDialog = await findByRole('dialog', { name: 'Zweites Bild' });
		expect(within(secondDialog).getByRole('img', { name: 'Zweites Bild' })).not.toBeNull();

		await user.click(getByRole('button', { name: 'Vorheriges Bild' }));
		const firstDialog = await findByRole('dialog', { name: 'Erstes Bild' });
		expect(within(firstDialog).getByRole('img', { name: 'Erstes Bild' })).not.toBeNull();
	});

	it('wraps from the last image to the first when paging forward past the end', async () => {
		const { findByRole, getByRole, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Drittes Bild vergrößern' }));
		await findByRole('dialog', { name: 'Drittes Bild' });

		await user.click(getByRole('button', { name: 'Nächstes Bild' }));

		const dialog = await findByRole('dialog', { name: 'Erstes Bild' });
		expect(within(dialog).getByRole('img', { name: 'Erstes Bild' })).not.toBeNull();
	});

	it('wraps from the first image to the last when paging backward past the start', async () => {
		const { findByRole, getByRole, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Erstes Bild vergrößern' }));
		await findByRole('dialog', { name: 'Erstes Bild' });

		await user.click(getByRole('button', { name: 'Vorheriges Bild' }));

		const dialog = await findByRole('dialog', { name: 'Drittes Bild' });
		expect(within(dialog).getByRole('img', { name: 'Drittes Bild' })).not.toBeNull();
	});

	it('closes on escape', async () => {
		const { findByRole, getByRole, queryByRole, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Erstes Bild vergrößern' }));
		await findByRole('dialog', { name: 'Erstes Bild' });

		await user.keyboard('{Escape}');

		expect(queryByRole('dialog')).toBeNull();
	});

	it('pages forward and backward through the images with the arrow keys', async () => {
		const { findByRole, getByRole, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Erstes Bild vergrößern' }));
		await findByRole('dialog', { name: 'Erstes Bild' });

		await user.keyboard('{ArrowRight}');
		const secondDialog = await findByRole('dialog', { name: 'Zweites Bild' });
		expect(secondDialog.getAttribute('role')).toBe('dialog');

		await user.keyboard('{ArrowLeft}');
		const firstDialog = await findByRole('dialog', { name: 'Erstes Bild' });
		expect(firstDialog.getAttribute('role')).toBe('dialog');
	});

	it('shows the caption of an image that has one', async () => {
		const { findByRole, getByRole, getByText, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Zweites Bild vergrößern' }));
		await findByRole('dialog', { name: 'Zweites Bild' });

		expect(getByText('Die Mannschaft beim Aufwärmen')).not.toBeNull();
	});

	it('renders no caption for an image that has none', async () => {
		const { findByRole, getByRole, queryByText, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Erstes Bild vergrößern' }));
		await findByRole('dialog', { name: 'Erstes Bild' });

		expect(queryByText('Die Mannschaft beim Aufwärmen')).toBeNull();
	});

	it('hides the paging controls for a gallery with a single image', async () => {
		const { findByRole, getByRole, queryByRole, user } = renderGallery([FIRST_IMAGE]);

		await user.click(getByRole('button', { name: 'Erstes Bild vergrößern' }));
		await findByRole('dialog', { name: 'Erstes Bild' });

		expect(queryByRole('button', { name: 'Nächstes Bild' })).toBeNull();
		expect(queryByRole('button', { name: 'Vorheriges Bild' })).toBeNull();
	});

	it('exposes a dialog role with an accessible name matching the open image', async () => {
		const { findByRole, getByRole, user } = renderGallery(THREE_IMAGES);

		await user.click(getByRole('button', { name: 'Zweites Bild vergrößern' }));

		const dialog = await findByRole('dialog', { name: 'Zweites Bild' });
		expect(dialog.getAttribute('role')).toBe('dialog');
	});
});
