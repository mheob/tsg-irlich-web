import { useIsPresentationTool } from 'next-sanity/hooks';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { DisableDraftMode } from './disable-draft-mode';

// The hook talks to the studio through `postMessage` and answers `undefined` until it knows; the
// mock turns each of its three states into an input of the test.
vi.mock(import('next-sanity/hooks'), () => ({ useIsPresentationTool: vi.fn() }));

const mockedUseIsPresentationTool = vi.mocked(useIsPresentationTool);

describe('the draft mode exit', () => {
	afterEach(() => {
		mockedUseIsPresentationTool.mockReset();
	});

	it('offers a link out of the preview when it runs in a plain browser tab', () => {
		mockedUseIsPresentationTool.mockReturnValue(false);

		const { getByRole } = renderWithUser(<DisableDraftMode />);

		expect(getByRole('link', { name: 'Vorschau beenden' }).getAttribute('href')).toBe(
			'/api/draft-mode/disable',
		);
	});

	it.each<[string, boolean | null]>([
		['inside the studio', true],
		['before the studio has answered', null],
	])('renders nothing %s', (_name, isPresentationTool) => {
		mockedUseIsPresentationTool.mockReturnValue(isPresentationTool);

		const { container } = renderWithUser(<DisableDraftMode />);

		expect(container.textContent).toBe('');
	});
});
