import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { Position } from '../_shared/types';
import { PositionDetails } from './position-details';

const HEADINGS = {
	offer: 'Das bieten wir',
	profile: 'Das bringst du mit',
	tasks: 'Deine Aufgaben',
};

function buildPosition(overrides: Partial<Position> = {}): Position {
	return {
		_id: 'position-1',
		area: 'Fußball',
		effort: 'nach Absprache',
		offer: ['Neulingslehrgang'],
		profile: ['Fairness'],
		tasks: ['Spiele leiten'],
		teaser: 'Jeder Verein muss Schiedsrichter stellen.',
		title: 'Schiedsrichter/in',
		...overrides,
	};
}

function renderDetails(position: Position) {
	return renderWithUser(
		<PositionDetails
			cta="Jetzt melden"
			headings={HEADINGS}
			href="mailto:info@tsg-irlich.de?subject=x"
			position={position}
		/>,
	);
}

describe('the details of an open position', () => {
	it('shows the teaser and the three lists under their headings', () => {
		const { getByRole, getByText } = renderDetails(buildPosition());

		expect(getByText('Jeder Verein muss Schiedsrichter stellen.')).not.toBeNull();
		expect(getByRole('list', { name: 'Deine Aufgaben' }).textContent).toBe('Spiele leiten');
		expect(getByRole('list', { name: 'Das bringst du mit' }).textContent).toBe('Fairness');
		expect(getByRole('list', { name: 'Das bieten wir' }).textContent).toBe('Neulingslehrgang');
		expect(getByRole('heading', { level: 4, name: 'Deine Aufgaben' })).not.toBeNull();
	});

	it('leaves an empty or missing list out', () => {
		const { queryByRole } = renderDetails(buildPosition({ offer: null, profile: [] }));

		expect(queryByRole('heading', { name: 'Das bringst du mit' })).toBeNull();
		expect(queryByRole('heading', { name: 'Das bieten wir' })).toBeNull();
		expect(queryByRole('heading', { name: 'Deine Aufgaben' })).not.toBeNull();
	});

	it('leaves the list grid out when all three lists are empty', () => {
		const { queryAllByRole } = renderDetails(
			buildPosition({ offer: [], profile: null, tasks: [] }),
		);

		expect(queryAllByRole('list')).toHaveLength(0);
	});

	it('links the button to the given mail', () => {
		const { getByRole } = renderDetails(buildPosition());

		expect(getByRole('link', { name: 'Jetzt melden' }).getAttribute('href')).toBe(
			'mailto:info@tsg-irlich.de?subject=x',
		);
	});
});
