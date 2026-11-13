import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import type { Position, PositionsSection } from '../_shared/types';
import { Positions } from './positions';

const INQUIRY = { email: 'info@tsg-irlich.de', subject: 'Ehrenamt bei der TSG Irlich' };

function buildSection(overrides: Partial<PositionsSection> = {}): PositionsSection {
	return {
		cta: 'Jetzt melden',
		intro: 'Vielleicht ist die richtige Aufgabe dabei.',
		offerHeading: 'Das bieten wir',
		otherText: 'Erzähl uns, was du dir vorstellen kannst.',
		otherTitle: 'Nichts Passendes dabei?',
		profileHeading: 'Das bringst du mit',
		steps: [
			{ _key: 's1', _type: 'volunteerStep', text: 'Per E-Mail.', title: 'Melde dich' },
			{ _key: 's2', _type: 'volunteerStep', text: 'Unverbindlich.', title: 'Lerne uns kennen' },
			{ _key: 's3', _type: 'volunteerStep', text: 'In deinem Tempo.', title: 'Leg los' },
		],
		subtitle: 'Aktuell gesucht',
		tasksHeading: 'Deine Aufgaben',
		title: 'Wir suchen Verstärkung',
		...overrides,
	};
}

function buildPosition(id: string, title: string, overrides: Partial<Position> = {}): Position {
	return {
		_id: id,
		area: 'Fußball',
		effort: '2× pro Woche',
		offer: ['Trainerlehrgänge'],
		profile: ['Spaß am Fußball'],
		tasks: ['Training mitgestalten'],
		teaser: `Anreißer zu ${title}`,
		title,
		...overrides,
	};
}

const POSITIONS = [
	buildPosition('p1', 'Co-Trainer/in F-Jugend'),
	buildPosition('p2', 'Schiedsrichter/in', { effort: null }),
];

describe('the open positions of the volunteer page', () => {
	it('carries the anchor the reasons button points to', () => {
		const { container } = renderWithUser(
			<Positions inquiry={INQUIRY} positions={POSITIONS} section={buildSection()} />,
		);

		expect(container.querySelector('section')?.id).toBe('aktuell-gesucht');
	});

	it('shows the header and the steps in order', () => {
		const { getByRole } = renderWithUser(
			<Positions inquiry={INQUIRY} positions={POSITIONS} section={buildSection()} />,
		);

		expect(getByRole('heading', { level: 2, name: 'Wir suchen Verstärkung' })).not.toBeNull();
		const steps = getByRole('list', { name: 'So geht es' }).querySelectorAll('li');
		expect([...steps].map((step) => step.textContent)).toStrictEqual([
			'1Melde dichPer E-Mail.',
			'2Lerne uns kennenUnverbindlich.',
			'3Leg losIn deinem Tempo.',
		]);
	});

	it('opens the first position and links its button with the title in the subject', () => {
		const { getByRole } = renderWithUser(
			<Positions inquiry={INQUIRY} positions={POSITIONS} section={buildSection()} />,
		);

		expect(getByRole('link', { name: 'Jetzt melden' }).getAttribute('href')).toBe(
			'mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich%3A%20Co-Trainer%2Fin%20F-Jugend',
		);
		expect(
			getByRole('button', { name: /Co-Trainer\/in F-Jugend/u }).getAttribute('aria-expanded'),
		).toBe('true');
		expect(getByRole('button', { name: /Schiedsrichter\/in/u }).getAttribute('aria-expanded')).toBe(
			'false',
		);
	});

	it('opens another position and closes the first', async () => {
		const { getByRole, user } = renderWithUser(
			<Positions inquiry={INQUIRY} positions={POSITIONS} section={buildSection()} />,
		);

		await user.click(getByRole('button', { name: /Schiedsrichter\/in/u }));

		expect(getByRole('button', { name: /Schiedsrichter\/in/u }).getAttribute('aria-expanded')).toBe(
			'true',
		);
		expect(
			getByRole('button', { name: /Co-Trainer\/in F-Jugend/u }).getAttribute('aria-expanded'),
		).toBe('false');
	});

	it('shows the effort badge only when a position has one', () => {
		const { getByRole } = renderWithUser(
			<Positions inquiry={INQUIRY} positions={POSITIONS} section={buildSection()} />,
		);

		expect(getByRole('button', { name: /Co-Trainer\/in F-Jugend/u }).textContent).toContain(
			'2× pro Woche',
		);
		expect(getByRole('button', { name: /Schiedsrichter\/in/u }).textContent).not.toContain(
			'2× pro Woche',
		);
	});

	it('links the other card to the mail without a topic', () => {
		const { getByRole } = renderWithUser(
			<Positions inquiry={INQUIRY} positions={POSITIONS} section={buildSection()} />,
		);

		expect(getByRole('link', { name: /Nichts Passendes dabei\?/u }).getAttribute('href')).toBe(
			'mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich',
		);
	});

	it('leaves the other card out without its title', () => {
		const { queryByRole } = renderWithUser(
			<Positions
				inquiry={INQUIRY}
				positions={POSITIONS}
				section={buildSection({ otherTitle: undefined })}
			/>,
		);

		expect(queryByRole('link', { name: /Erzähl uns/u })).toBeNull();
	});

	it('shows steps and the other card but no accordion without positions', () => {
		const { getByRole, queryAllByRole } = renderWithUser(
			<Positions inquiry={INQUIRY} positions={[]} section={buildSection()} />,
		);

		expect(queryAllByRole('button')).toHaveLength(0);
		expect(getByRole('list', { name: 'So geht es' })).not.toBeNull();
		expect(getByRole('link', { name: /Nichts Passendes dabei\?/u })).not.toBeNull();
	});
});
