import { describe, expect, it } from 'vitest';

import type { Home } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { Features } from './features';

type FeatureSection = Home['content']['featureSection'];

function buildSection(features: unknown[]): FeatureSection {
	// The generated type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		features,
		intro: 'Das macht uns aus.',
		subtitle: 'Über uns',
		title: 'Vorteile',
	} as unknown as FeatureSection;
}

const FEATURE = { icon: 'Dumbbell', intro: 'Über 18 Sportarten.', title: 'Vielfalt' };

describe('the feature section', () => {
	it('heads the section with its title and introduction', () => {
		const { getByRole, getByText } = renderWithUser(<Features {...buildSection([FEATURE])} />);

		expect(getByRole('heading', { name: 'Vorteile' })).not.toBeNull();
		expect(getByText('Das macht uns aus.')).not.toBeNull();
	});

	it('renders one card per feature', () => {
		const { getByText } = renderWithUser(
			<Features
				{...buildSection([FEATURE, { icon: 'House', intro: 'Mitten im Ort.', title: 'Nähe' }])}
			/>,
		);

		expect(getByText('Vielfalt')).not.toBeNull();
		expect(getByText('Nähe')).not.toBeNull();
	});

	it.each([
		['icon', { ...FEATURE, icon: null }],
		['introduction', { ...FEATURE, intro: null }],
		['title', { ...FEATURE, title: null }],
	])('skips a feature without an %s', (_name, feature) => {
		const { queryByText } = renderWithUser(<Features {...buildSection([feature])} />);

		expect(queryByText('Über 18 Sportarten.')).toBeNull();
	});

	it('renders no cards when the section carries no features', () => {
		const { queryByText } = renderWithUser(<Features {...buildSection([])} />);

		expect(queryByText('Vielfalt')).toBeNull();
	});
});
