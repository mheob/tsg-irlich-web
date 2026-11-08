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

export { isRegistrationForm, validateFormFields };
