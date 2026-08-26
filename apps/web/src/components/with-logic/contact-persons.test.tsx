import { describe, expect, it } from 'vitest';

import type { ContactPerson } from '@/types/sanity.types';

import { loadWithEnv } from '../../../test-utils/env';
import { renderWithUser } from '../../../test-utils/render';
import type * as ContactPersonsModule from './contact-persons';

// `contact-persons.tsx` imports `urlForImage` from `@/lib/sanity/utils`, which imports the Sanity
// `client` (`@/lib/sanity/client` → `@/lib/sanity/api`), and `api.ts` reads
// `NEXT_PUBLIC_SANITY_DATASET`/`NEXT_PUBLIC_SANITY_PROJECT_ID` from `process.env` at module top
// level, throwing immediately if either is missing — before any test in this file even runs a
// component. `loadWithEnv` (`test-utils/env.ts`) stubs both and re-imports the module fresh, the
// same pattern `src/utils/url.test.ts` uses for `@/lib/env.ts`'s module-level caching; the values
// themselves are arbitrary, since no test here asserts on the built image URL.
const SANITY_ENV = {
	NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
	NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
};

async function loadContactPersons() {
	return loadWithEnv<typeof ContactPersonsModule>(
		'@/components/with-logic/contact-persons',
		SANITY_ENV,
	);
}

const BASE_PERSON: ContactPerson = {
	contactAs: 'both',
	email: 'anna.schmidt@tsg-irlich.de',
	firstName: 'Anna',
	image: { _type: 'extendedImage', alt: '' },
	lastName: 'Schmidt',
	phone: '0176 1234567',
	role: 'Vorstandsvorsitzende',
	taskDescription: 'Ansprechpartnerin für den Vorstand.',
};

const PERSON_WITH_IMAGE: ContactPerson = {
	...BASE_PERSON,
	image: {
		_type: 'extendedImage',
		alt: 'Porträt von Anna Schmidt',
		asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
	},
};

// Declared once at module scope, rather than as inline array literals at each call site, per the
// `react-perf/jsx-no-new-array-as-prop` rule (still active for `.test.tsx` files despite the
// `**/*.tsx` override in `oxlint.config.ts` — see `navigation.test.tsx`'s `renderNavigation` for
// the same pattern).
const NO_IMAGE_LIST: ContactPerson[] = [BASE_PERSON];
const WITH_IMAGE_LIST: ContactPerson[] = [PERSON_WITH_IMAGE];
const EMPTY_LIST: ContactPerson[] = [];

describe('the contact persons list', () => {
	it('falls back to the initials when a person has no image', async () => {
		const { ContactPersons } = await loadContactPersons();
		const { container, getByText } = renderWithUser(
			<ContactPersons contactPersons={NO_IMAGE_LIST} />,
		);

		expect(getByText('AS')).not.toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});

	it('renders an image instead of initials once a person has one', async () => {
		const { ContactPersons } = await loadContactPersons();
		const { container, getByRole, queryByText } = renderWithUser(
			<ContactPersons contactPersons={WITH_IMAGE_LIST} />,
		);

		expect(getByRole('img', { name: 'Porträt von Anna Schmidt' })).not.toBeNull();
		expect(queryByText('AS')).toBeNull();
		expect(container.querySelectorAll('article')).toHaveLength(1);
	});

	it('renders nothing when the list is empty', async () => {
		const { ContactPersons } = await loadContactPersons();
		const { container } = renderWithUser(<ContactPersons contactPersons={EMPTY_LIST} />);

		expect(container.querySelectorAll('article')).toHaveLength(0);
	});
});
