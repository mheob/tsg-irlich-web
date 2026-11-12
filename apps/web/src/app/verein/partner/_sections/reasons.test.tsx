import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { ReasonsSection } from '../_shared/types';
import { Reasons } from './reasons';

function buildReason(title: string, icon: 'heart' | 'star' = 'heart') {
	return { _key: title, _type: 'partnerReason', icon, text: `Text zu ${title}`, title } as const;
}

function buildSection(reasons: ReasonsSection['reasons']): ReasonsSection {
	return {
		intro: 'Warum es sich lohnt',
		reasons,
		subtitle: 'Gute Gründe',
		title: 'Warum Sponsor?',
	};
}

describe('the reasons section of the partner page', () => {
	it('shows the section header and one card per entry', () => {
		const { getByRole, getByText } = renderWithUser(
			<Reasons {...buildSection([buildReason('Nähe'), buildReason('Reichweite', 'star')])} />,
		);

		expect(getByRole('heading', { name: 'Warum Sponsor?' })).not.toBeNull();
		expect(getByText('Gute Gründe')).not.toBeNull();
		expect(getByText('Nähe')).not.toBeNull();
		expect(getByText('Reichweite')).not.toBeNull();
	});

	it('shows the intro and the text of a card', () => {
		const { getByText } = renderWithUser(<Reasons {...buildSection([buildReason('Nähe')])} />);

		expect(getByText('Warum es sich lohnt')).not.toBeNull();
		expect(getByText('Text zu Nähe')).not.toBeNull();
	});

	it('leaves the whole section out without cards', () => {
		const { container } = renderWithUser(<Reasons {...buildSection([])} />);

		expect(container.innerHTML).toBe('');
	});

	it('leaves the whole section out when the cards are missing', () => {
		const { container } = renderWithUser(<Reasons {...buildSection(null as never)} />);

		expect(container.innerHTML).toBe('');
	});
});
