import { RiSurveyLine } from 'react-icons/ri';
import type { ConditionalPropertyCallbackContext } from 'sanity';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { FORM_DEFAULT_TEXTS } from '@tsgi-web/shared';

import {
	content,
	formFields,
	general,
	mails,
	meta,
	registration,
	texts,
} from '@/shared/field-groups';
import { formattedSlugField, titleField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { isRegistrationForm, validateFormFields } from '@/utils/form-validation';

/** The kinds of fields an editor can add to a form, in the order the menu offers them. */
const FIELD_TYPES = [
	'formFieldText',
	'formFieldTextarea',
	'formFieldEmail',
	'formFieldPhone',
	'formFieldNumber',
	'formFieldDate',
	'formFieldChoice',
	'formFieldConsent',
	'formFieldGroup',
	'formFieldNote',
] as const;

/**
 * Hides a setting that only exists for registration forms.
 *
 * @param context - The context the studio passes to a `hidden` callback.
 * @param context.document - The form document.
 * @returns `true` when the form takes no registrations.
 */
function hideUnlessRegistration({ document }: ConditionalPropertyCallbackContext): boolean {
	return !isRegistrationForm(document);
}

const form = defineType({
	fields: [
		// General
		defineField({
			group: 'general',
			initialValue: 'registration',
			name: 'formType',
			options: { layout: 'radio', list: [{ title: 'Anmeldung', value: 'registration' }] },
			title: 'Art des Formulars',
			type: 'string',
			validation: (Rule) => Rule.required().error('Die Art des Formulars ist erforderlich'),
		}),
		titleField,
		formattedSlugField,

		// Content
		defineField({
			description: 'Querformat, erscheint oben auf der Seite.',
			group: 'content',
			name: 'heroImage',
			title: 'Bild',
			type: 'extendedImage',
		}),
		defineField({
			group: 'content',
			name: 'intro',
			title: 'Einleitung',
			type: 'simpleBlockContent',
		}),
		defineField({
			group: 'content',
			name: 'eventDate',
			title: 'Veranstaltung am',
			type: 'datetime',
		}),
		defineField({ group: 'content', name: 'location', title: 'Ort', type: 'string' }),

		// Fields
		defineField({
			group: 'formFields',
			name: 'fields',
			of: FIELD_TYPES.map((type) => defineArrayMember({ type })),
			title: 'Felder',
			type: 'array',
			validation: (Rule) => [
				Rule.required().min(1).error('Ein Formular braucht mindestens ein Feld'),
				Rule.custom((fields, context) => validateFormFields(fields, context.document)),
			],
		}),

		// Registration
		defineField({
			group: 'registration',
			hidden: hideUnlessRegistration,
			name: 'registrationStart',
			title: 'Anmeldung ab',
			type: 'datetime',
		}),
		defineField({
			group: 'registration',
			hidden: hideUnlessRegistration,
			name: 'registrationEnd',
			title: 'Anmeldeschluss',
			type: 'datetime',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const start = context.document?.registrationStart;
					return !value || typeof start !== 'string' || new Date(value) > new Date(start)
						? true
						: 'Der Anmeldeschluss muss nach dem Beginn der Anmeldung liegen';
				}),
		}),
		defineField({
			description: 'Ab dieser Zahl an Anmeldungen kommen weitere auf die Warteliste.',
			group: 'registration',
			hidden: hideUnlessRegistration,
			name: 'capacity',
			title: 'Obergrenze',
			type: 'number',
			validation: (Rule) => Rule.integer().min(1).error('Die Obergrenze muss mindestens 1 sein'),
		}),
		defineField({
			group: 'registration',
			hidden: ({ document }) => !isRegistrationForm(document) || document?.capacity === undefined,
			initialValue: true,
			name: 'showRemaining',
			title: 'Freie Plätze anzeigen',
			type: 'boolean',
		}),
		defineField({
			description: 'Ab diesem Tag löscht die Bereinigung die Anmeldungen dieses Formulars.',
			group: 'registration',
			hidden: hideUnlessRegistration,
			name: 'cleanupAt',
			title: 'Bereinigen ab',
			type: 'date',
		}),

		// Mails
		defineField({
			group: 'mails',
			hidden: hideUnlessRegistration,
			initialValue: true,
			name: 'notifyOrganizer',
			title: 'Eingang an die Veranstalter melden',
			type: 'boolean',
		}),
		defineField({
			group: 'mails',
			hidden: hideUnlessRegistration,
			name: 'receivers',
			of: [defineArrayMember({ type: 'contactNameMail' })],
			title: 'Empfänger',
			type: 'array',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const notify = context.document?.notifyOrganizer;
					return notify === true && (!value || value.length === 0)
						? 'Mindestens ein Empfänger ist erforderlich'
						: true;
				}),
		}),
		defineField({
			group: 'mails',
			hidden: hideUnlessRegistration,
			initialValue: true,
			name: 'sendConfirmation',
			title: 'Bestätigung an die Anmeldenden senden',
			type: 'boolean',
		}),
		defineField({
			group: 'mails',
			hidden: hideUnlessRegistration,
			name: 'confirmationSubject',
			title: 'Betreff der Bestätigung',
			type: 'string',
		}),
		defineField({
			group: 'mails',
			hidden: hideUnlessRegistration,
			initialValue: FORM_DEFAULT_TEXTS.confirmation,
			name: 'confirmationText',
			title: 'Text der Bestätigung',
			type: 'text',
		}),
		defineField({
			group: 'mails',
			hidden: hideUnlessRegistration,
			initialValue: FORM_DEFAULT_TEXTS.waitlistConfirmation,
			name: 'waitlistConfirmationText',
			title: 'Text der Bestätigung für die Warteliste',
			type: 'text',
		}),
		defineField({
			group: 'mails',
			hidden: hideUnlessRegistration,
			initialValue: false,
			name: 'includeAnswersInConfirmation',
			title: 'Angaben in der Bestätigung wiederholen',
			type: 'boolean',
		}),

		// Texts
		defineField({
			description: 'Platzhalter: {start} für den Beginn der Anmeldung.',
			group: 'texts',
			initialValue: FORM_DEFAULT_TEXTS.beforeStart,
			name: 'beforeStartText',
			title: 'Text vor Beginn der Anmeldung',
			type: 'text',
		}),
		defineField({
			group: 'texts',
			initialValue: FORM_DEFAULT_TEXTS.afterEnd,
			name: 'afterEndText',
			title: 'Text nach dem Anmeldeschluss',
			type: 'text',
		}),
		defineField({
			group: 'texts',
			initialValue: FORM_DEFAULT_TEXTS.waitlistNotice,
			name: 'waitlistNotice',
			title: 'Hinweis auf die Warteliste',
			type: 'text',
		}),
		defineField({
			group: 'texts',
			initialValue: FORM_DEFAULT_TEXTS.success,
			name: 'successText',
			title: 'Text nach erfolgreicher Anmeldung',
			type: 'text',
		}),
		defineField({
			group: 'texts',
			initialValue: FORM_DEFAULT_TEXTS.waitlistSuccess,
			name: 'waitlistSuccessText',
			title: 'Text nach Anmeldung auf der Warteliste',
			type: 'text',
		}),

		// Meta
		metaField,
	],
	groups: [general, content, formFields, registration, mails, texts, meta],
	icon: RiSurveyLine,
	name: 'form',
	preview: { select: { title: 'title' } },
	title: 'Formular',
	type: 'document',
});

export default form;
