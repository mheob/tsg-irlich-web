const TIME_ZONE = 'Europe/Berlin';

const eventDateFormat = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	hour: '2-digit',
	hourCycle: 'h23',
	minute: '2-digit',
	month: '2-digit',
	timeZone: TIME_ZONE,
	weekday: 'short',
	year: 'numeric',
});

const shortDateFormat = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	month: '2-digit',
	timeZone: TIME_ZONE,
	year: 'numeric',
});

/**
 * Formats an instant for a visitor, in the club's time zone.
 *
 * @param iso - An ISO date time.
 * @returns For example `Fr., 14.05.2027, 13:00 Uhr`.
 */
function formatEventDate(iso: string): string {
	return `${eventDateFormat.format(new Date(iso))} Uhr`;
}

/**
 * Formats the day of an instant, in the club's time zone.
 *
 * @param iso - An ISO date time or date.
 * @returns For example `30.04.2027`.
 */
function formatShortDate(iso: string): string {
	return shortDateFormat.format(new Date(iso));
}

export { formatEventDate, formatShortDate };
