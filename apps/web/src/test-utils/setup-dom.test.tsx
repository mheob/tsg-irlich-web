import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../test-utils/render';
import { setPathname } from '../../test-utils/setup-dom';

function PathnameProbe() {
	const pathname = usePathname();
	return <span>{pathname}</span>;
}

// Regression coverage for the global mocks `../../test-utils/setup-dom.ts` registers through
// `setupFiles` — nothing else committed exercises them directly, so a regression in either mock
// would otherwise only be caught incidentally by a later, unrelated test failing in a confusing way.
//
// This file deliberately does not live at `apps/web/test-utils/setup-dom.test.tsx`: neither Vitest
// project's `include` glob in `vitest.config.ts` matches anything outside `src/` (the `dom` project
// matches `src/**/*.test.tsx`), and this task may not touch `vitest.config.ts`. Placed here, under
// `src/`, the file actually runs as part of `pnpm --filter web test`.
describe('the next/image mock', () => {
	it('keeps the image queryable by its accessible name', () => {
		const { getByRole } = renderWithUser(
			<Image alt="Vereinslogo" height={40} src="/logo.png" width={40} />,
		);

		expect(getByRole('img', { name: 'Vereinslogo' })).not.toBeNull();
	});
});

describe('the next/navigation mock', () => {
	it('resolves usePathname to whatever setPathname last set', () => {
		setPathname('/kontakt');

		const { getByText } = renderWithUser(<PathnameProbe />);

		expect(getByText('/kontakt')).not.toBeNull();
	});
});
