const DATE_PARTS = 3;

function parseDate(value: string): [number, number, number] {
	const parts = value.split('-').map(Number);
	if (parts.length !== DATE_PARTS || parts.some((part) => Number.isNaN(part))) {
		throw new TypeError(`Expected a YYYY-MM-DD date, got "${value}".`);
	}
	const [year = 0, month = 0, day = 0] = parts;
	return [year, month, day];
}

/**
 * The age in full years on a reference date, by calendar arithmetic without time zones. Someone
 * born on 29 February turns a year older on 1 March in a year that has no 29 February.
 *
 * @param birthDate - The birth date as `YYYY-MM-DD`.
 * @param referenceDate - The day the age is measured on, as `YYYY-MM-DD`.
 * @returns The completed years, which is negative before the birth.
 */
function getAgeOn(birthDate: string, referenceDate: string): number {
	const [birthYear, birthMonth, birthDay] = parseDate(birthDate);
	const [year, month, day] = parseDate(referenceDate);
	const hadBirthday = month > birthMonth || (month === birthMonth && day >= birthDay);
	return year - birthYear - (hadBirthday ? 0 : 1);
}

export { getAgeOn };
