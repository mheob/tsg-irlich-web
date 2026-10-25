import { describe, expect, it, vi } from 'vite-plus/test';

import type { DepartmentPageQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../test-utils/render';
import { Groups } from './groups';

// The cards fall back to `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that asserts
// its project variables at import time. `vi.hoisted` runs before the imports are evaluated;
// `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

type Group = NonNullable<DepartmentPageQueryResult>['groups'][number];

function group(slug: string, title: string, overviewTitle: null | string = null): Group {
	return {
		featuredImage: { _type: 'extendedImage', alt: title },
		icon: 'Fussball',
		overviewTitle,
		slug,
		title,
	};
}

function renderGroups(groups: Group[], departmentSlug = 'fussball') {
	return renderWithUser(
		<Groups
			departmentSlug={departmentSlug}
			departmentTitle="Fußball"
			groups={groups}
			intro="Alle Mannschaften auf einen Blick"
			subtitle="Unsere Teams"
			title="Gruppen"
		/>,
	);
}

describe('the groups section of a department page', () => {
	it('names the department in the heading', () => {
		const { getByRole } = renderGroups([]);

		expect(getByRole('heading', { level: 2 }).textContent).toBe('Gruppen Fußball');
	});

	it('shows the intro', () => {
		const { getByText } = renderGroups([]);

		expect(getByText('Alle Mannschaften auf einen Blick')).not.toBeNull();
	});

	it('links every group below its department, in the order given', () => {
		const { getAllByRole } = renderGroups([group('herren', 'Herren'), group('damen', 'Damen')]);

		expect(
			getAllByRole('link').map((link) => [
				link.getAttribute('aria-label'),
				link.getAttribute('href'),
			]),
		).toStrictEqual([
			['Mehr über "Herren" erfahren', '/angebot/fussball/herren'],
			['Mehr über "Damen" erfahren', '/angebot/fussball/damen'],
		]);
	});

	it('shows the overview title of a group instead of its title', () => {
		const { getByRole } = renderGroups([group('herren', 'Herren', 'Erste Mannschaft')]);

		expect(getByRole('heading', { level: 3 }).textContent).toBe('Erste Mannschaft');
	});

	it('renders no link when the department has no slug', () => {
		const { queryAllByRole } = renderGroups([group('herren', 'Herren')], '');

		expect(queryAllByRole('link')).toStrictEqual([]);
	});
});
