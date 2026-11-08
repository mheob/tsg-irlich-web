import type { SubmissionStatus } from './types';

const GROUP_FIELD_TYPE = 'formFieldGroup';
const NOTE_FIELD_TYPE = 'formFieldNote';

const SUBMISSION_STATUS_LABELS: Readonly<Record<SubmissionStatus, string>> = {
	cancelled: 'abgemeldet',
	registered: 'angemeldet',
	waitlist: 'Warteliste',
};

/**
 * What a form says when the editors left a text empty. `success` and `waitlistSuccess` show on the
 * page after a submission, `confirmation` and `waitlistConfirmation` open the confirmation mail.
 * The page text promises no mail, since a form may send none.
 */
const FORM_DEFAULT_TEXTS: Readonly<{
	afterEnd: string;
	beforeStart: string;
	confirmation: string;
	success: string;
	waitlistConfirmation: string;
	waitlistNotice: string;
	waitlistSuccess: string;
}> = {
	afterEnd: 'Die Anmeldung ist beendet.',
	beforeStart: 'Die Anmeldung ist ab {start} möglich.',
	confirmation: 'Vielen Dank! Deine Anmeldung ist bei uns eingegangen.',
	success: 'Vielen Dank! Deine Anmeldung ist eingegangen.',
	waitlistConfirmation:
		'Vielen Dank! Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.',
	waitlistNotice: 'Alle Plätze sind vergeben. Neue Anmeldungen kommen auf die Warteliste.',
	waitlistSuccess:
		'Vielen Dank! Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.',
};

export { FORM_DEFAULT_TEXTS, GROUP_FIELD_TYPE, NOTE_FIELD_TYPE, SUBMISSION_STATUS_LABELS };
