import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { PricingCard } from './pricing-card';

function renderCard() {
	return renderWithUser(
		<PricingCard
			benefits={['Alle Kurse', 'Vereinsfeste']}
			benefitsTitle="Das ist dabei"
			cta="Mitglied werden"
			intro="Für alle ab 18 Jahren."
			price={12}
			subtitle="Mitgliedschaft"
			title="Erwachsene"
		>
			<svg aria-hidden="true" />
		</PricingCard>,
	);
}

describe('a pricing card', () => {
	// The cards sit below the h2 of the pricing section.
	it('heads the card with its title one level below the section', () => {
		const { getByRole } = renderCard();

		expect(getByRole('heading', { level: 3, name: 'Erwachsene' })).not.toBeNull();
	});

	it('heads the benefits one level below the title', () => {
		const { getByRole } = renderCard();

		expect(getByRole('heading', { level: 4, name: 'Das ist dabei' })).not.toBeNull();
	});

	it('links its call to action to the membership downloads', () => {
		const { getByRole } = renderCard();

		expect(getByRole('link', { name: 'Mitglied werden' }).getAttribute('href')).toBe(
			'/mitgliedschaft#downloads',
		);
	});
});
