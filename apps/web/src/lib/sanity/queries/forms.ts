import { defineQuery } from 'next-sanity';

import { blockContent } from '@/lib/sanity/queries';

/** What every field type shares in the projection; a type without an attribute yields `null`. */
const formFieldAttributes = /* groq */ `
  _key,
  _type,
  label,
  helpText,
  isRequired,
  width,
  retention,
  maxLength,
  min,
  max,
  minAge,
  referenceDate,
  options,
  isMultiple,
  display,
  isLabel,
  isConfirmationRecipient,
  itemLabel,
  minItems,
  maxItems,
  title,
  text { ${blockContent} }
`;

/** The fields of a form, with the fields of a group nested one level down. */
const formFields = /* groq */ `
  ${formFieldAttributes},
  fields[] { ${formFieldAttributes} }
`;

/**
 * Query to get a form page by its slug. It never reads `receivers`: the page hands its data to
 * client components, so an address here would be published in the HTML.
 *
 * @param $slug - The slug of the form
 * @returns The form, `null` when there is none
 */
export const formPageQuery = defineQuery(`
	*[_type == 'form' && slug.current == $slug][0] {
		_id,
		formType,
		title,
		heroImage,
		intro,
		eventDate,
		location,
		registrationStart,
		registrationEnd,
		capacity,
		showRemaining,
		beforeStartText,
		afterEndText,
		waitlistNotice,
		successText,
		waitlistSuccessText,
		meta,
		fields[] { ${formFields} }
	}
`);

/**
 * Query to get everything the server action needs to process a submission, including the
 * receivers' addresses. For the server only.
 *
 * @param $id - The `_id` of the form
 * @returns The form, `null` when there is none
 */
export const formByIdQuery = defineQuery(`
	*[_type == 'form' && _id == $id][0] {
		_id,
		formType,
		title,
		"slug": slug.current,
		eventDate,
		location,
		registrationStart,
		registrationEnd,
		capacity,
		notifyOrganizer,
		receivers[] { email, name },
		sendConfirmation,
		confirmationSubject,
		confirmationText,
		waitlistConfirmationText,
		includeAnswersInConfirmation,
		fields[] { ${formFields} }
	}
`);

/**
 * Query to count the registered submissions of a form; the waitlist and cancellations do not count
 * against the capacity.
 *
 * @param $formId - The `_id` of the form
 * @returns The number of registered submissions
 */
export const formRegisteredCountQuery = defineQuery(
	`count(*[_type == "form.submission" && form._ref == $formId && status == "registered" && !(_id in path("drafts.**"))])`,
);

/**
 * Query to get the submissions the clean-up has to process: not cleaned yet, and their form's
 * `cleanupAt` day has begun. `cleanupAt` is a date and `now()` a date time, and GROQ compares both
 * as strings, which orders them correctly (`"2026-11-08" <= "2026-11-08T10:00:00Z"`).
 *
 * @returns The due submissions with the revision to patch against
 */
export const dueSubmissionsQuery = defineQuery(
	`*[_type == "form.submission" && !defined(cleanedAt) && form->cleanupAt <= now() && !(_id in path("drafts.**"))]{ _id, _rev, answers }`,
);
