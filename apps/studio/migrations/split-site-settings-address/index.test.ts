import type { SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import migration, { parseAddress } from './index';

type DocumentMigration = (document: SanityDocument) => unknown;

function migrate(contact?: Record<string, unknown>): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return document({
		_createdAt: '2026-01-01T00:00:00Z',
		_id: 'site-settings',
		_rev: 'rev',
		_type: 'site-settings',
		_updatedAt: '2026-01-01T00:00:00Z',
		contact,
	} as SanityDocument);
}

describe('splitting the site settings address', () => {
	it('splits street, house number, postal code and city', () => {
		expect(parseAddress('Gotenstraße 20, 56567 Neuwied')).toStrictEqual({
			city: 'Neuwied',
			houseNumber: '20',
			street: 'Gotenstraße',
			zipCode: '56567',
		});
	});

	it('keeps a street and a city made of several words', () => {
		expect(parseAddress('Am Alten Sportplatz 3a, 56566 Neuwied Engers')).toStrictEqual({
			city: 'Neuwied Engers',
			houseNumber: '3a',
			street: 'Am Alten Sportplatz',
			zipCode: '56566',
		});
	});

	it.each(['Gotenstraße 20', 'Gotenstraße, 56567 Neuwied', 'Gotenstraße 20, Neuwied'])(
		'refuses "%s" instead of writing a half-parsed address',
		(address) => {
			expect(() => parseAddress(address)).toThrow('hat nicht die Form');
		},
	);

	it('moves the address into its parts and removes the text field', () => {
		expect(migrate({ address: 'Gotenstraße 20, 56567 Neuwied', email: 'info@tsg-irlich.de' }))
			.toMatchInlineSnapshot(`
				[
				  {
				    "op": {
				      "type": "set",
				      "value": {
				        "city": "Neuwied",
				        "houseNumber": "20",
				        "street": "Gotenstraße",
				        "zipCode": "56567",
				      },
				    },
				    "path": [
				      "contact",
				      "postalAddress",
				    ],
				  },
				  {
				    "op": {
				      "type": "unset",
				    },
				    "path": [
				      "contact",
				      "address",
				    ],
				  },
				]
			`);
	});

	it('leaves a document alone that has no address text any more', () => {
		expect(migrate({ email: 'info@tsg-irlich.de' })).toStrictEqual([]);
		expect(migrate()).toStrictEqual([]);
	});
});
