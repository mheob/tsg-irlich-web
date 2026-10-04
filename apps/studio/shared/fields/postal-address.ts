// oxlint-disable no-magic-numbers

import { defineField } from 'sanity';

/**
 * The parts of a postal address: street, house number, postal code and city.
 *
 * Kept apart instead of in one text field, so the website can print the address, link it to a map
 * and hand it to search engines as a `PostalAddress` without parsing a string.
 */
const postalAddressFields = [
	defineField({
		name: 'street',
		title: 'Straße',
		type: 'string',
		validation: (Rule) => [
			Rule.required().min(2).error('Die Straße muss mindestens 2 Zeichen lang sein'),
			Rule.max(128).warning('Die Straße sollte nicht länger als 128 Zeichen sein'),
		],
	}),

	defineField({
		name: 'houseNumber',
		title: 'Hausnummer',
		type: 'string',
		validation: (Rule) => [
			Rule.required().min(1).error('Die Hausnummer muss mindestens 1 Zeichen lang sein'),
			Rule.max(8).warning('Die Hausnummer sollte nicht länger als 8 Zeichen sein'),
		],
	}),

	defineField({
		name: 'zipCode',
		title: 'Postleitzahl',
		type: 'string',
		validation: (Rule) => [
			Rule.regex(/^\d{5}$/u).error('Die Postleitzahl muss aus genau 5 Zahlen bestehen'),
		],
	}),

	defineField({
		name: 'city',
		title: 'Stadt',
		type: 'string',
		validation: (Rule) => [
			Rule.required().min(3).error('Die Stadt muss mindestens 3 Zeichen lang sein'),
			Rule.max(64).warning('Die Stadt sollte nicht länger als 64 Zeichen sein'),
		],
	}),
];

export { postalAddressFields };
