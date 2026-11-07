import { renderToString } from 'react-dom/server';
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

	it('sends every figure with its final value, once, so a crawler reads the real numbers', () => {
		const values = [
			{ suffix: '+', title: 'Mitglieder', value: 650 },
			{ prefix: '< ', title: 'Jahre Tradition', value: 1200 },
		] as unknown as Stats[];
		const markup = document.createElement('div');
		markup.innerHTML = renderToString(<Counter values={values} />);

		const figures = [...markup.querySelectorAll('p')].map(
			(label) => `${label.previousElementSibling?.textContent} ${label.textContent}`,
		);

		expect(figures).toStrictEqual(['650+ Mitglieder', '< 1.200 Jahre Tradition']);
	});

	it('says so when there are no values at all', () => {
		const { getByText } = renderWithUser(<Counter values={buildStats(0)} />);

		expect(getByText('No values')).not.toBeNull();
	});
});
