import { describe, expect, it, vi } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { GroupCard } from './group-card';

// The card falls back to `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that asserts
// its project variables at import time. `vi.hoisted` runs before the imports are evaluated;
// `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

const DEPARTMENT = {
	_type: 'group.soccer',
	icon: 'Fussball',
	image: { alt: 'Fußball', src: '/fussball.webp' },
	slug: '/angebot/fussball',
	title: 'Fußball',
} as const;

describe('the group card', () => {
	it('links to the group below its department', () => {
		const { getByRole } = renderWithUser(
			<GroupCard currentDepartment={DEPARTMENT} icon="Fussball" slug="herren-1" title="Herren 1" />,
		);

		expect(getByRole('link', { name: 'Mehr über "Herren 1" erfahren' }).getAttribute('href')).toBe(
			'/angebot/fussball/herren-1',
		);
	});

	it('links to the slug alone when it belongs to no department', () => {
		const { getByRole } = renderWithUser(
			<GroupCard icon="Fussball" slug="/angebot/fussball" title="Fußball" />,
		);

		expect(getByRole('link', { name: 'Mehr über "Fußball" erfahren' }).getAttribute('href')).toBe(
			'/angebot/fussball',
		);
	});

	it('prefers the overview title over the group title', () => {
		const { getByRole } = renderWithUser(
			<GroupCard icon="Fussball" overviewTitle="Erste Herren" slug="herren-1" title="Herren 1" />,
		);

		expect(getByRole('heading', { name: 'Erste Herren' })).not.toBeNull();
	});

	it('shows the group title as the image alternative text', () => {
		const { getByRole } = renderWithUser(
			<GroupCard icon="Fussball" slug="herren-1" title="Herren 1" />,
		);

		expect(getByRole('img', { name: 'Herren 1' })).not.toBeNull();
	});

	it.each([
		['slug', { slug: null, title: 'Herren 1' }],
		['title', { slug: 'herren-1', title: null }],
	])('renders nothing for a group without a %s', (_name, group) => {
		const { container } = renderWithUser(
			<GroupCard icon="Fussball" slug={group.slug} title={group.title} />,
		);

		expect(container.textContent).toBe('');
	});
});
