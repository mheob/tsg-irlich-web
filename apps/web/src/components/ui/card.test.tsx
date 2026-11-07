import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { Card, CardHeader, CardTitle } from './card';

describe('a card title', () => {
	it('heads a card below a section with an h3', () => {
		const { getByRole } = renderWithUser(
			<Card>
				<CardHeader>
					<CardTitle>Training</CardTitle>
				</CardHeader>
			</Card>,
		);

		expect(getByRole('heading', { level: 3, name: 'Training' })).not.toBeNull();
	});

	it('takes the level of a card that heads a section itself', () => {
		const { getByRole } = renderWithUser(
			<Card>
				<CardHeader>
					<CardTitle level="h2">Feedback</CardTitle>
				</CardHeader>
			</Card>,
		);

		expect(getByRole('heading', { level: 2, name: 'Feedback' })).not.toBeNull();
	});
});
