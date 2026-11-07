import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../test-utils/render';
import NotFound from './not-found';

describe('the not-found page', () => {
	it('heads the page with what went wrong', () => {
		const { getAllByRole, getByRole } = renderWithUser(<NotFound />);

		expect(
			getByRole('heading', { level: 1, name: 'Falscher Link? Falsche Adresse?' }),
		).not.toBeNull();
		expect(getAllByRole('heading')).toHaveLength(1);
	});
});
