import { describe, expect, it } from 'vitest';

import type { Stats } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { Counter } from './counter';

function buildStats(count: number): Stats[] {
	// The generated type carries the object meta fields as well.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return Array.from({ length: count }, (_unused, index) => ({
		title: `Kennzahl ${index + 1}`,
		value: (index + 1) * 100,
	})) as unknown as Stats[];
}

describe('the counter', () => {
	it('renders one entry per value, each with its title', () => {
		const { getByRole } = renderWithUser(<Counter values={buildStats(3)} />);

		expect(getByRole('heading', { name: 'Kennzahl 1' })).not.toBeNull();
		expect(getByRole('heading', { name: 'Kennzahl 3' })).not.toBeNull();
	});

	it('wraps a value in its prefix and suffix', () => {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const values = [
			{ prefix: 'über ', suffix: '+', title: 'Mitglieder', value: 1200 },
		] as unknown as Stats[];
		const { getByText } = renderWithUser(<Counter values={values} />);

		expect(getByText(/über/u)).not.toBeNull();
		expect(getByText(/\+/u)).not.toBeNull();
	});

	it('says so when there are no values at all', () => {
		const { getByText } = renderWithUser(<Counter values={buildStats(0)} />);

		expect(getByText('No values')).not.toBeNull();
	});
});
