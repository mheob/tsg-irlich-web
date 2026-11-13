import { describe, expect, it } from 'vite-plus/test';

import { getMailHref } from '@/utils/mail';

import { renderWithUser } from '../../../../../test-utils/render';
import type { PartnersSection, Sponsor } from '../_shared/types';
import { Partners } from './partners';

const INQUIRY = { email: 'partner@tsg-irlich.de', subject: 'Sponsoring bei der TSG Irlich' };

function buildSponsor(name: string): Sponsor {
	return { _id: name, logo: { _type: 'image' }, name, website: null };
}

function buildSection(overrides: Partial<PartnersSection> = {}): PartnersSection {
	return {
		intro: 'Danke an alle',
		ownLogoText: 'Dein Logo hier?',
		subtitle: 'Gemeinsam stark',
		title: 'Unsere Partner',
		...overrides,
	};
}

describe('the partners section of the partner page', () => {
	it('lists the sponsors in the order given and ends with the own-logo tile', () => {
		const { getAllByRole } = renderWithUser(
			<Partners
				inquiry={INQUIRY}
				section={buildSection()}
				sponsors={[buildSponsor('Zeta'), buildSponsor('Alpha')]}
			/>,
		);
		const items = getAllByRole('listitem').map((item) => item.textContent);

		expect(items).toHaveLength(3);
		expect(items[0]).toContain('Zeta');
		expect(items[1]).toContain('Alpha');
		expect(items[2]).toContain('Dein Logo hier?');
	});

	it('shows the section header', () => {
		const { getByRole } = renderWithUser(
			<Partners inquiry={INQUIRY} section={buildSection()} sponsors={[buildSponsor('Alpha')]} />,
		);

		expect(getByRole('heading', { name: 'Unsere Partner' })).not.toBeNull();
	});

	it('links the own-logo tile to the inquiry mail', () => {
		const { getByRole } = renderWithUser(
			<Partners inquiry={INQUIRY} section={buildSection()} sponsors={[buildSponsor('Alpha')]} />,
		);

		expect(getByRole('link', { name: 'Dein Logo hier?' }).getAttribute('href')).toBe(
			getMailHref(INQUIRY),
		);
	});

	it('leaves out the own-logo tile without its text', () => {
		const { getAllByRole, queryByRole } = renderWithUser(
			<Partners
				inquiry={INQUIRY}
				section={buildSection({ ownLogoText: undefined })}
				sponsors={[buildSponsor('Alpha')]}
			/>,
		);

		expect(getAllByRole('listitem')).toHaveLength(1);
		expect(queryByRole('link', { name: 'Dein Logo hier?' })).toBeNull();
	});

	it('leaves the section out without sponsors and without an own-logo text', () => {
		const { container } = renderWithUser(
			<Partners
				inquiry={INQUIRY}
				section={buildSection({ ownLogoText: undefined })}
				sponsors={[]}
			/>,
		);

		expect(container.innerHTML).toBe('');
	});
});
