import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { ReasonsSection } from '../_shared/types';
import { Reasons } from './reasons';

function buildReason(title: string) {
	return {
		_key: title,
		_type: 'volunteerReason',
		icon: 'heart',
		text: `Text zu ${title}`,
		title,
	} as const;
}

function buildSection(overrides: Partial<ReasonsSection> = {}): ReasonsSection {
	return {
		cta: 'Offene Aufgaben ansehen',
		intro: 'Ehrenamt bedeutet mehr.',
		reasons: [buildReason('Gemeinschaft'), buildReason('Sinn stiften')],
		subtitle: 'Warum engagieren?',
		title: 'Gemeinsam mehr erreichen',
		...overrides,
	};
}

describe('the reasons section of the volunteer page', () => {
	it('shows the header and one card per reason', () => {
		const { getByRole, getByText } = renderWithUser(
			<Reasons hasPositions section={buildSection()} />,
		);

		expect(getByRole('heading', { level: 2, name: 'Gemeinsam mehr erreichen' })).not.toBeNull();
		expect(getByText('Ehrenamt bedeutet mehr.')).not.toBeNull();
		expect(getByRole('heading', { level: 3, name: 'Gemeinschaft' })).not.toBeNull();
		expect(getByRole('heading', { level: 3, name: 'Sinn stiften' })).not.toBeNull();
		expect(getByText('Text zu Sinn stiften')).not.toBeNull();
	});

	it('links the button to the open positions when there are some', () => {
		const { getByRole } = renderWithUser(<Reasons hasPositions section={buildSection()} />);

		expect(getByRole('link', { name: 'Offene Aufgaben ansehen' }).getAttribute('href')).toBe(
			'#aktuell-gesucht',
		);
	});

	it('leaves the button out without open positions', () => {
		const { queryByRole } = renderWithUser(
			<Reasons hasPositions={false} section={buildSection()} />,
		);

		expect(queryByRole('link')).toBeNull();
	});

	it('leaves the button out without a button text', () => {
		const { queryByRole } = renderWithUser(
			<Reasons hasPositions section={buildSection({ cta: undefined })} />,
		);

		expect(queryByRole('link')).toBeNull();
	});

	it('leaves the whole section out without reasons', () => {
		const { container } = renderWithUser(
			<Reasons hasPositions section={buildSection({ reasons: [] })} />,
		);

		expect(container.innerHTML).toBe('');
	});
});
