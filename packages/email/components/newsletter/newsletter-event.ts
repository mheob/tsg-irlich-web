// Shape of one entry in the „Blick voraus" section, shared by the newsletter props, the
// event list and the date badge so all three stay in sync.
export interface NewsletterEvent {
	/** Day of the month, e.g. `07`. */
	day: string;
	/** Venue and time, e.g. `Pappelstadion · 14:00 Uhr`. */
	meta: string;
	/** Short month, e.g. `Aug`. */
	month: string;
	title: string;
	/** Short weekday, e.g. `Mo` or `Sa`. */
	weekday: string;
}
