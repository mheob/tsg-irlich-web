import type { Metadata } from 'next';
import { stegaClean } from 'next-sanity';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { FORM_DEFAULT_TEXTS } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { getRegisteredCount } from '@/lib/forms/registered-count';
import { getRegistrationState, getRemainingPlaces } from '@/lib/forms/registration-state';
import type { RegistrationState } from '@/lib/forms/registration-state';
import { sanityFetch } from '@/lib/sanity/live';
import { formPageQuery } from '@/lib/sanity/queries/forms';
import type { FormPageQueryResult } from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';

import { RegistrationInfo } from './_sections/registration-info';
import { RegistrationPanel } from './_sections/registration-panel';

/**
 * The line under the facts of the event: that the waitlist has begun, or how many places are left.
 *
 * @param form - The form document.
 * @param state - Where the registration stands.
 * @param registeredCount - How many submissions are registered.
 * @returns The line, or `undefined` when there is nothing to say.
 */
function getNotice(
	form: Pick<NonNullable<FormPageQueryResult>, 'capacity' | 'showRemaining' | 'waitlistNotice'>,
	state: RegistrationState,
	registeredCount: number,
): string | undefined {
	if (state === 'waitlist') {
		// An empty text counts as missing, which `??` would keep.
		// oxlint-disable-next-line typescript/prefer-nullish-coalescing
		return form.waitlistNotice || FORM_DEFAULT_TEXTS.waitlistNotice;
	}

	if (state === 'open' && form.showRemaining && form.capacity) {
		return `Noch ${getRemainingPlaces(form.capacity, registeredCount)} von ${form.capacity} Plätzen frei`;
	}

	return undefined;
}

/**
 * The state of a registration follows the clock (it opens and closes at an instant), and no
 * webhook fires for that. The page is rebuilt at most this many seconds after an instant has
 * passed; a literal, since Next.js reads it statically.
 */
// oxlint-disable-next-line react/only-export-components -- a route segment option, not a component
export const revalidate = 60;

// oxlint-disable-next-line typescript/require-await -- Next.js expects a promise
export async function generateStaticParams(): Promise<{ slug: string }[]> {
	// A form is only prerendered on its first visit; its state changes with the clock anyway.
	return [];
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/anmeldung/[slug]'>>): Promise<Metadata> {
	const { slug } = await params;
	const { data: form } = await sanityFetch({
		params: { slug },
		query: formPageQuery,
		stega: false,
	});

	if (!form) {
		return {};
	}

	return getPageMetadata({
		image: form.heroImage,
		meta: form.meta,
		path: `/anmeldung/${slug}`,
		title: form.title,
	});
}

export default async function RegistrationPage({
	params,
}: Readonly<PageProps<'/anmeldung/[slug]'>>) {
	const { slug } = await params;
	const [{ data: form }, { isEnabled: isPreview }] = await Promise.all([
		sanityFetch({ params: { slug }, query: formPageQuery }),
		draftMode(),
	]);

	// A form of another type has a page of its own, or none.
	if (!form || stegaClean(form.formType) !== 'registration') {
		notFound();
	}

	// Dates are read with `new Date()`, which a stega suffix would make invalid.
	const registrationStart = stegaClean(form.registrationStart);
	const registrationEnd = stegaClean(form.registrationEnd);
	const eventDate = stegaClean(form.eventDate);
	// Without a capacity the count changes nothing, so it is not asked for.
	const registeredCount = form.capacity ? await getRegisteredCount(form._id) : 0;
	const state = getRegistrationState({
		capacity: form.capacity,
		now: new Date(),
		registeredCount,
		registrationEnd,
		registrationStart,
	});

	return (
		<>
			<Hero
				breadcrumb={{ page: form.title }}
				image={getPageHeroImage(form.heroImage, form.title)}
				subTitle="Anmeldung"
				title={form.title}
			/>
			<div className="grid lg:grid-cols-[2fr_3fr]">
				<RegistrationInfo
					eventDate={eventDate}
					heroImage={form.heroImage}
					intro={form.intro}
					location={form.location}
					notice={getNotice(form, state, registeredCount)}
					registrationEnd={registrationEnd}
					title={form.title}
				/>
				<RegistrationPanel
					// The form compares the types, widths and options of the fields to literals and submits the
					// options as values, so no stega character may be in them.
					form={{ ...form, fields: stegaClean(form.fields), registrationStart }}
					isPreview={isPreview}
					state={state}
				/>
			</div>
		</>
	);
}
