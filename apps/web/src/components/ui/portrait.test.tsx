import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { Portrait } from './portrait';

// The image goes through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that asserts its
// project variables at import time. `vi.hoisted` runs before the imports are evaluated;
// `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

const IMAGE = {
	_type: 'extendedImage',
	alt: 'Porträt von Ada Lovelace',
	asset: { _ref: ASSET_REF, _type: 'reference' },
} as const;

const IMAGE_WITHOUT_FILE = { _type: 'extendedImage', alt: '' } as const;

describe('the portrait of a person', () => {
	it('shows the image under its alternative text', () => {
		const { getByRole } = renderWithUser(
			<Portrait firstName="Ada" image={IMAGE} lastName="Lovelace" sourceSize={64} />,
		);

		expect(getByRole('img', { name: 'Porträt von Ada Lovelace' })).not.toBeNull();
	});

	it('requests a square crop at the source size', () => {
		const { getByRole } = renderWithUser(
			<Portrait firstName="Ada" image={IMAGE} lastName="Lovelace" sourceSize={64} />,
		);

		const source = new URL((getByRole('img') as HTMLImageElement).src);
		expect(source.searchParams.get('w')).toBe('64');
		expect(source.searchParams.get('h')).toBe('64');
	});

	it('falls back to the initials when the person has no image', () => {
		const { getByText, queryByRole } = renderWithUser(
			<Portrait firstName="Ada" image={null} lastName="Lovelace" sourceSize={64} />,
		);

		expect(getByText('AL')).not.toBeNull();
		expect(queryByRole('img')).toBeNull();
	});

	it('falls back to the initials when the image has no file', () => {
		const { getByText, queryByRole } = renderWithUser(
			<Portrait firstName="Ada" image={IMAGE_WITHOUT_FILE} lastName="Lovelace" sourceSize={64} />,
		);

		expect(getByText('AL')).not.toBeNull();
		expect(queryByRole('img')).toBeNull();
	});

	// Every place that shows a portrait names the person right beside it, so reading the initials
	// out as well would only repeat the name in a shorter form.
	it('hides the initials from assistive technology', () => {
		const { getByText } = renderWithUser(
			<Portrait firstName="Ada" image={null} lastName="Lovelace" sourceSize={64} />,
		);

		expect(getByText('AL').getAttribute('aria-hidden')).toBe('true');
	});
});
