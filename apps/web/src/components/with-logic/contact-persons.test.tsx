import { describe, expect, it, vi } from 'vitest';

import type { SanityImage, SanityImageReference } from '@/types/image.types';
import type { ContactPerson } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { ContactPersons } from './contact-persons';

// `contact-persons.tsx` reaches `urlForImage` (`@/lib/sanity/utils`), which imports the real Sanity
// client chain (`@/lib/sanity/client` → `@/lib/sanity/api`), and `api.ts` throws at module load if
// `NEXT_PUBLIC_SANITY_DATASET`/`NEXT_PUBLIC_SANITY_PROJECT_ID` are missing. The component's own
// logic under test here (the initials fallback, the empty list) needs none of that — it only cares
// whether `urlForImage` returns a truthy URL or `undefined`. An earlier version of this file went
// through `loadWithEnv` to satisfy the real chain, which pulls in `@sanity/image-url` and resets the
// whole module registry; that measured at ~3s for a fallback check that should be near-instant.
// Mocking the module boundary the component actually reaches — rather than loading it for real —
// avoids that entirely and lets `ContactPersons` be imported normally, like any other component.
vi.mock(import('@/lib/sanity/utils'), () => ({
	urlForImage: (image: null | SanityImage | SanityImageReference | undefined) =>
		image?.asset?._ref ? `https://cdn.example.test/${image.asset._ref}.jpg` : undefined,
}));

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
const PHONE_ONLY_LIST: ContactPerson[] = [{ ...BASE_PERSON, contactAs: 'phone' }];
const WHATSAPP_ONLY_LIST: ContactPerson[] = [{ ...BASE_PERSON, contactAs: 'whatsapp' }];
const EMAIL_ONLY_LIST: ContactPerson[] = [{ ...BASE_PERSON, contactAs: 'email' }];
const NO_PHONE_LIST: ContactPerson[] = [{ ...BASE_PERSON, phone: null }];

// `contact-link.tsx` forces this exact aria-label on every `ContactLink` before it has been
// interacted with, discarding whatever `ui/contact-button.tsx` passed in (see
// `contact-link.test.tsx`'s "overrides a caller-supplied aria-label..." case) — so every contact
// control, whatever it links to, is queryable by this one generic name before interaction.
const KONTAKTLINK_LABEL = 'Kontaktlink - tippen zum Anzeigen';

describe('the contact persons list', () => {
	it('falls back to the initials when a person has no image', () => {
		const { container, getByText } = renderWithUser(
			<ContactPersons contactPersons={NO_IMAGE_LIST} />,
		);

		expect(getByText('AS')).not.toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});

	it('renders an image instead of initials once a person has one', () => {
		const { container, getByRole, queryByText } = renderWithUser(
			<ContactPersons contactPersons={WITH_IMAGE_LIST} />,
		);

		expect(getByRole('img', { name: 'Porträt von Anna Schmidt' })).not.toBeNull();
		expect(queryByText('AS')).toBeNull();
		expect(container.querySelectorAll('article')).toHaveLength(1);
	});

	it('renders nothing when the list is empty', () => {
		const { container } = renderWithUser(<ContactPersons contactPersons={EMPTY_LIST} />);

		expect(container.querySelectorAll('article')).toHaveLength(0);
	});

	// Each `controls[n]` reference is queried once, before any interaction, then reused after
	// clicking it — the underlying DOM node persists across the re-render, so `getAttribute('href')`
	// on the same reference sees the real `mailto:`/`tel:`/`wa.me` href `ContactLink` resolves to
	// once interacted with (see `contact-link.tsx`'s `createContactLink`).
	it('shows the phone control but not whatsapp when contactAs is "phone"', async () => {
		const { getAllByRole, user } = renderWithUser(
			<ContactPersons contactPersons={PHONE_ONLY_LIST} />,
		);

		const controls = getAllByRole('button', { name: KONTAKTLINK_LABEL });
		expect(controls).toHaveLength(2);

		await user.click(controls[0]);
		expect(controls[0].getAttribute('href')).toBe('mailto:anna.schmidt@tsg-irlich.de');

		await user.click(controls[1]);
		expect(controls[1].getAttribute('href')).toBe('tel:01761234567');
	});

	it('shows the whatsapp control but not phone when contactAs is "whatsapp"', async () => {
		const { getAllByRole, user } = renderWithUser(
			<ContactPersons contactPersons={WHATSAPP_ONLY_LIST} />,
		);

		const controls = getAllByRole('button', { name: KONTAKTLINK_LABEL });
		expect(controls).toHaveLength(2);

		await user.click(controls[0]);
		expect(controls[0].getAttribute('href')).toBe('mailto:anna.schmidt@tsg-irlich.de');

		await user.click(controls[1]);
		expect(controls[1].getAttribute('href')).toBe('https://wa.me/01761234567');
	});

	it('shows all three controls, email, phone and whatsapp, when contactAs is "both"', async () => {
		const { getAllByRole, user } = renderWithUser(
			<ContactPersons contactPersons={NO_IMAGE_LIST} />,
		);

		const controls = getAllByRole('button', { name: KONTAKTLINK_LABEL });
		expect(controls).toHaveLength(3);

		await user.click(controls[0]);
		expect(controls[0].getAttribute('href')).toBe('mailto:anna.schmidt@tsg-irlich.de');

		await user.click(controls[1]);
		expect(controls[1].getAttribute('href')).toBe('tel:01761234567');

		await user.click(controls[2]);
		expect(controls[2].getAttribute('href')).toBe('https://wa.me/01761234567');
	});

	it('shows only the email control when contactAs is "email", even though a phone number is set', async () => {
		const { getAllByRole, user } = renderWithUser(
			<ContactPersons contactPersons={EMAIL_ONLY_LIST} />,
		);

		const controls = getAllByRole('button', { name: KONTAKTLINK_LABEL });
		expect(controls).toHaveLength(1);

		await user.click(controls[0]);
		expect(controls[0].getAttribute('href')).toBe('mailto:anna.schmidt@tsg-irlich.de');
	});

	it('hides both phone and whatsapp controls when the phone number is absent, regardless of contactAs', async () => {
		const { getAllByRole, user } = renderWithUser(
			<ContactPersons contactPersons={NO_PHONE_LIST} />,
		);

		const controls = getAllByRole('button', { name: KONTAKTLINK_LABEL });
		expect(controls).toHaveLength(1);

		await user.click(controls[0]);
		expect(controls[0].getAttribute('href')).toBe('mailto:anna.schmidt@tsg-irlich.de');
	});
});
