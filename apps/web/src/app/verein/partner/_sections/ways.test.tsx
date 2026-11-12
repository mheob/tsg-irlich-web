import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../../test-utils/render';
import { getMailHref } from '../_shared/mail';
import type { WaysSection } from '../_shared/types';
import { Ways } from './ways';

const INQUIRY = { email: 'partner@tsg-irlich.de', subject: 'Sponsoring bei der TSG Irlich' };

function buildWay(title: string, benefits?: string[]) {
	return {
		_key: title,
		_type: 'partnerWay',
		benefits,
		icon: 'shirt',
		text: `Text zu ${title}`,
		title,
	} as const;
}

function buildSection(overrides: Partial<WaysSection> = {}): WaysSection {
	return {
		ideaCta: 'Jetzt melden',
		ideaText: 'Du hast eine eigene Idee?',
		subtitle: 'Mitmachen',
		title: 'So kannst du uns unterstützen',
		ways: [
			buildWay('Trikotwerbung', ['Logo auf dem Trikot', 'Nennung im Heft']),
			buildWay('Bande'),
		],
		...overrides,
	};
}

describe('the ways section of the partner page', () => {
	it('shows the section header and one card per entry', () => {
		const { getByRole, getByText } = renderWithUser(<Ways {...buildSection()} inquiry={INQUIRY} />);

		expect(getByRole('heading', { name: 'So kannst du uns unterstützen' })).not.toBeNull();
		expect(getByRole('heading', { name: 'Trikotwerbung' })).not.toBeNull();
		expect(getByRole('heading', { name: 'Bande' })).not.toBeNull();
		expect(getByText('Text zu Bande')).not.toBeNull();
	});

	it('leaves the whole section out without cards', () => {
		const { container } = renderWithUser(
			<Ways {...buildSection({ ways: [] })} inquiry={INQUIRY} />,
		);

		expect(container.innerHTML).toBe('');
	});

	it('puts no inquiry button into the cards', () => {
		const { getAllByRole } = renderWithUser(<Ways {...buildSection()} inquiry={INQUIRY} />);

		expect(getAllByRole('article').map((card) => card.querySelector('a'))).toStrictEqual([
			null,
			null,
		]);
	});

	it('lists the benefits of a card and omits the list without any', () => {
		const { getAllByRole, getByText } = renderWithUser(
			<Ways {...buildSection()} inquiry={INQUIRY} />,
		);

		expect(getByText('Logo auf dem Trikot')).not.toBeNull();
		expect(getByText('Nennung im Heft')).not.toBeNull();
		expect(getAllByRole('list')).toHaveLength(1);
	});

	it('shows the own-idea line and button only when both texts are set', () => {
		const { getByRole, getByText, queryByRole, queryByText, rerender } = renderWithUser(
			<Ways {...buildSection()} inquiry={INQUIRY} />,
		);

		expect(getByText('Du hast eine eigene Idee?')).not.toBeNull();
		expect(getByRole('link', { name: 'Jetzt melden' }).getAttribute('href')).toBe(
			getMailHref(INQUIRY),
		);

		rerender(<Ways {...buildSection({ ideaCta: undefined })} inquiry={INQUIRY} />);
		expect(queryByText('Du hast eine eigene Idee?')).toBeNull();
		expect(queryByRole('link', { name: 'Jetzt melden' })).toBeNull();

		rerender(<Ways {...buildSection({ ideaText: undefined })} inquiry={INQUIRY} />);
		expect(queryByRole('link', { name: 'Jetzt melden' })).toBeNull();
	});
});
