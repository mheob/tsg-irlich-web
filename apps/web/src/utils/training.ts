/** The German names of the weekdays a training time is stored with. */
const WEEKDAY_LABELS = {
	friday: 'Freitag',
	monday: 'Montag',
	saturday: 'Samstag',
	sunday: 'Sonntag',
	thursday: 'Donnerstag',
	tuesday: 'Dienstag',
	wednesday: 'Mittwoch',
} as const;

/** The German names of the seasons a training time applies in. */
const SEASON_LABELS = {
	summer: 'Sommer',
	winter: 'Winter',
	yearly: 'Ganzjährig',
} as const;

export { SEASON_LABELS, WEEKDAY_LABELS };
