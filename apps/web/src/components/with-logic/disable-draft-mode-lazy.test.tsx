import { useIsPresentationTool } from 'next-sanity/hooks';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { DisableDraftModeLazy } from './disable-draft-mode-lazy';

vi.mock(import('next-sanity/hooks'), () => ({ useIsPresentationTool: vi.fn() }));

const mockedUseIsPresentationTool = vi.mocked(useIsPresentationTool);

describe('the lazily loaded draft mode exit', () => {
	afterEach(() => {
		mockedUseIsPresentationTool.mockReset();
	});

	it('renders nothing on the server', () => {
		mockedUseIsPresentationTool.mockReturnValue(false);

		expect(renderToString(<DisableDraftModeLazy />)).toBe('');
	});

	it('loads the link in the browser', async () => {
		mockedUseIsPresentationTool.mockReturnValue(false);

		const { findByRole } = renderWithUser(<DisableDraftModeLazy />);

		const link = await findByRole('link', { name: 'Vorschau beenden' });
		expect(link.getAttribute('href')).toBe('/api/draft-mode/disable');
	});
});
