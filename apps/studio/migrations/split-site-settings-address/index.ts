import { at, defineMigration, set, unset } from 'sanity/migrate';

interface PostalAddress {
	city: string;
	houseNumber: string;
	street: string;
	zipCode: string;
}

/**
 * Splits an address written as `Straße Hausnummer, Postleitzahl Ort` into its parts.
 *
 * @param address - The address as the old text field held it.
 * @returns The address parts.
 * @throws {Error} When the text does not have that shape, so the migration never writes a half-parsed
 *   address.
 */
function parseAddress(address: string): PostalAddress {
	const [streetPart = '', cityPart = ''] = address.split(',').map((part) => part.trim());
	const houseNumberStart = streetPart.lastIndexOf(' ');
	const cityStart = cityPart.indexOf(' ');

	const street = streetPart.slice(0, houseNumberStart);
	const houseNumber = streetPart.slice(houseNumberStart + 1);
	const zipCode = cityPart.slice(0, cityStart);
	const city = cityPart.slice(cityStart + 1);

	if (houseNumberStart < 1 || cityStart < 1 || !/^\d{5}$/u.test(zipCode) || !city) {
		throw new Error(`Die Adresse "${address}" hat nicht die Form "Straße Hausnummer, PLZ Ort".`);
	}

	return { city, houseNumber, street, zipCode };
}

export default defineMigration({
	documentTypes: ['site-settings'],
	migrate: {
		document({ contact }) {
			const address =
				typeof contact === 'object' && contact !== null && 'address' in contact
					? contact.address
					: undefined;

			// Already migrated, or never had the text field: nothing to patch.
			if (typeof address !== 'string') {
				return [];
			}

			return [
				at('contact.postalAddress', set(parseAddress(address))),
				at('contact.address', unset()),
			];
		},
	},
	title: 'Die Anschrift in den Site Settings in Straße, Hausnummer, PLZ und Ort aufteilen',
});

export { parseAddress };
