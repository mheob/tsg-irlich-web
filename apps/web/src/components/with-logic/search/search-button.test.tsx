import { createRef } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { SearchButton } from './search-button';

describe('the lupe', () => {
	it('is a button named „Suche öffnen“ that announces the dialog it opens', () => {
		const { getByRole } = renderWithUser(<SearchButton onOpen={vi.fn()} />);

		const button = getByRole('button', { name: 'Suche öffnen' });
		expect(button.getAttribute('aria-haspopup')).toBe('dialog');
		// Inside a form a button without a type would submit it.
		expect(button.getAttribute('type')).toBe('button');
	});

	it('keeps its icon away from assistive technology, the label names the button', () => {
		const { getByRole } = renderWithUser(<SearchButton onOpen={vi.fn()} />);

		expect(getByRole('button').querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('asks to open the search when it is clicked', async () => {
		const onOpen = vi.fn();
		const { getByRole, user } = renderWithUser(<SearchButton onOpen={onOpen} />);

		await user.click(getByRole('button', { name: 'Suche öffnen' }));

		expect(onOpen).toHaveBeenCalledOnce();
	});

	it('hands its element to the ref, so the focus can return to it', () => {
		const ref = createRef<HTMLButtonElement>();
		const { getByRole } = renderWithUser(<SearchButton onOpen={vi.fn()} ref={ref} />);

		expect(ref.current).toBe(getByRole('button', { name: 'Suche öffnen' }));
	});
});
