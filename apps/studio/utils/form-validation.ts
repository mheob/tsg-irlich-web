/**
 * Reads a property of a value Sanity hands over untyped (a document or an array member).
 *
 * @param value - The value to read from.
 * @param key - The property to read.
 * @returns The property, or `undefined` for anything that is no object or lacks it.
 */
function readProperty(value: unknown, key: string): unknown {
	return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;
}

/** The retentions that make the clean-up touch an answer; `keep` and a missing one leave it. */
const CLEANED_RETENTIONS = new Set(['delete', 'year']);

const MISSING_CLEANUP_WARNING =
	'Ohne Datum werden die als „löschen“ markierten Angaben nie bereinigt.';
const EARLY_CLEANUP_WARNING =
	'Die Bereinigung liegt vor der Veranstaltung – die Angaben fehlen dann am Veranstaltungstag.';
const CLEANED_RECIPIENT_WARNING =
	'Die Adresse der Bestätigungsmail bleibt im Mailversand gespeichert, auch wenn sie bereinigt wird.';

/** The day of an instant in the club's time zone, as `YYYY-MM-DD` like a Sanity `date`. */
const berlinDay = new Intl.DateTimeFormat('en-CA', {
	day: '2-digit',
	month: '2-digit',
	timeZone: 'Europe/Berlin',
	year: 'numeric',
});

/**
 * Reads a list Sanity hands over untyped, such as the `fields` of a form or of a group.
 *
 * @param value - The value to read.
 * @returns The list, or an empty one for anything that is no array.
 */
function toList(value: unknown): readonly unknown[] {
	return Array.isArray(value) ? value : [];
}

/**
 * Checks whether the clean-up changes the answers of a field: it deletes them or cuts them to the
 * year.
 *
 * @param field - A field of the form or of a group.
 * @returns `true` for the retention `delete` or `year`.
 */
function isCleanedField(field: unknown): boolean {
	const retention = readProperty(field, 'retention');
	return typeof retention === 'string' && CLEANED_RETENTIONS.has(retention);
}

/**
 * Checks whether any field of a form, or of one of its groups, is cleaned up.
 *
 * @param fields - The fields of the form.
 * @returns `true` as soon as one field has the retention `delete` or `year`.
 */
function hasCleanedFields(fields: unknown): boolean {
	return toList(fields).some(
		(field) => isCleanedField(field) || hasCleanedFields(readProperty(field, 'fields')),
	);
}

/**
 * The day the clean-up must come after: the day of the event in Berlin, or without an event the day
 * the registration ends.
 *
 * @param document - The form document.
 * @returns The day as `YYYY-MM-DD`, or `undefined` when the form has neither date.
 */
function getEventDay(document: object | undefined): string | undefined {
	const eventDate = readProperty(document, 'eventDate');
	const registrationEnd = readProperty(document, 'registrationEnd');
	const instant = typeof eventDate === 'string' && eventDate ? eventDate : registrationEnd;
	if (typeof instant !== 'string' || Number.isNaN(Date.parse(instant))) {
		return undefined;
	}
	return berlinDay.format(new Date(instant));
}

/**
 * Checks whether a form cleans up answers but has no day to do it on. The clean-up only touches
 * the submissions of a form whose `cleanupAt` has begun, so such answers would stay forever.
 *
 * @param cleanupAt - The day of the clean-up, if set.
 * @param document - The form document with its `fields`.
 * @returns `true` when a field is cleaned up and the day is missing.
 */
function isCleanupDateMissing(cleanupAt: unknown, document: object | undefined): boolean {
	return !cleanupAt && hasCleanedFields(readProperty(document, 'fields'));
}

/**
 * Checks whether the clean-up comes too early. The daily run starts at 03:00 UTC, so a clean-up on
 * the day of the event already removes the answers before it starts, and one on an earlier day
 * all the more.
 *
 * @param cleanupAt - The day of the clean-up, `YYYY-MM-DD`.
 * @param document - The form document with its `eventDate` and `registrationEnd`.
 * @returns `true` when the clean-up falls on or before the event day.
 */
function isCleanupBeforeEvent(cleanupAt: unknown, document: object | undefined): boolean {
	const eventDay = getEventDay(document);
	return typeof cleanupAt === 'string' && cleanupAt !== '' && eventDay !== undefined
		? cleanupAt <= eventDay
		: false;
}

/**
 * The warnings on the clean-up date of a form: one when answers are cleaned up but no day is set,
 * one when the day comes before the event is over.
 *
 * @param cleanupAt - The day of the clean-up, if set.
 * @param document - The form document.
 * @returns `true`, or the message for an editor.
 */
function validateCleanupDate(cleanupAt: unknown, document: object | undefined): string | true {
	if (isCleanupDateMissing(cleanupAt, document)) {
		return MISSING_CLEANUP_WARNING;
	}
	return isCleanupBeforeEvent(cleanupAt, document) ? EARLY_CLEANUP_WARNING : true;
}

/**
 * Warns when the address the confirmation goes to is cleaned up. The clean-up removes it from the
 * submission, but the mail service keeps the mail it sent there.
 *
 * @param fields - The fields of the form.
 * @returns `true`, or the message for an editor.
 */
function validateRecipientRetention(fields: readonly unknown[] | undefined): string | true {
	const recipient = (fields ?? []).find(
		(field) => readProperty(field, 'isConfirmationRecipient') === true,
	);
	return isCleanedField(recipient) ? CLEANED_RECIPIENT_WARNING : true;
}

/**
 * Checks whether a form takes registrations, which is what unlocks the registration and mail tabs.
 *
 * @param document - The form document, absent while the editor is still loading.
 * @returns `true` for a registration form.
 */
function isRegistrationForm(document: object | undefined): boolean {
	return readProperty(document, 'formType') === 'registration';
}

/**
 * Checks the markers of the form fields: at most one field names a submission, at most one email
 * field receives the confirmation, and a confirmation needs such a field.
 *
 * @param fields - The fields of the form, each with its `_type` and the optional markers
 *   `isLabel` and `isConfirmationRecipient`.
 * @param document - The form document; its `sendConfirmation` decides whether a recipient is needed.
 * @returns `true`, or the message for an editor.
 */
function validateFormFields(
	fields: readonly unknown[] | undefined,
	document: object | undefined,
): string | true {
	const list = fields ?? [];

	if (list.filter((field) => readProperty(field, 'isLabel') === true).length > 1) {
		return 'Höchstens ein Feld darf den Eingang bezeichnen';
	}

	const recipients = list.filter(
		(field) => readProperty(field, 'isConfirmationRecipient') === true,
	).length;
	if (recipients > 1) {
		return 'Höchstens ein E-Mail-Feld darf die Bestätigung empfangen';
	}

	if (readProperty(document, 'sendConfirmation') === true && recipients === 0) {
		return 'Für die Bestätigungsmail ein E-Mail-Feld als Empfänger markieren';
	}

	return true;
}

export {
	isCleanupBeforeEvent,
	isCleanupDateMissing,
	isRegistrationForm,
	validateCleanupDate,
	validateFormFields,
	validateRecipientRetention,
};
