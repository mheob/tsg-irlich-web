import type { SubmissionStatus } from './types';

const GROUP_FIELD_TYPE = 'formFieldGroup';
const NOTE_FIELD_TYPE = 'formFieldNote';

const SUBMISSION_STATUS_LABELS: Readonly<Record<SubmissionStatus, string>> = {
	cancelled: 'abgemeldet',
	registered: 'angemeldet',
	waitlist: 'Warteliste',
};

const FORM_DEFAULT_TEXTS: Readonly<{
	afterEnd: string;
	beforeStart: string;
	success: string;
	waitlistNotice: string;
	waitlistSuccess: string;
}> = {
	afterEnd: 'Die Anmeldung ist beendet.',
	beforeStart: 'Die Anmeldung ist ab {start} möglich.',
	success: 'Vielen Dank! Deine Anmeldung ist eingegangen. Eine Bestätigung kommt per E-Mail.',
	waitlistNotice: 'Alle Plätze sind vergeben. Neue Anmeldungen kommen auf die Warteliste.',
	waitlistSuccess:
		'Vielen Dank! Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.',
};

export { FORM_DEFAULT_TEXTS, GROUP_FIELD_TYPE, NOTE_FIELD_TYPE, SUBMISSION_STATUS_LABELS };
