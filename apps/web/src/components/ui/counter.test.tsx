import { describe, expect, it } from 'vite-plus/test';

import type { Stats } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { Counter } from './counter';

function buildStats(count: number): Stats[] {
	// The generated type carries the object meta fields as well.
	return Array.from({ length: count }, (_unused, index) => ({
		title: `Kennzahl ${index + 1}`,
		value: (index + 1) * 100,
	})) as unknown as Stats[];
}

describe('the counter', () => {
	it('renders one entry per value, each with its title', () => {
		const { getByText } = renderWithUser(<Counter values={buildStats(3)} />);

		expect(getByText('Kennzahl 1')).not.toBeNull();
		expect(getByText('Kennzahl 3')).not.toBeNull();
	});

	it('labels its values without turning the labels into headings', () => {
		const { queryAllByRole } = renderWithUser(<Counter values={buildStats(4)} />);

		expect(queryAllByRole('heading')).toStrictEqual([]);
	});

	it('wraps a value in its prefix and suffix', () => {
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
