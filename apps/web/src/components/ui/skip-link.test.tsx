import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { SkipLink } from './skip-link';

describe('the skip link', () => {
	it('leads past the navigation to the element holding the content', () => {
		const { getByRole } = renderWithUser(<SkipLink targetId="main" />);

		expect(getByRole('link', { name: 'Zum Inhalt springen' }).getAttribute('href')).toBe('#main');
	});

	it('is the first stop of the tab order', async () => {
		const { getByRole, user } = renderWithUser(
			<>
				<SkipLink targetId="main" />
				<button type="button">Menü</button>
			</>,
		);

		await user.tab();

		expect(document.activeElement).toBe(getByRole('link', { name: 'Zum Inhalt springen' }));
	});
});
