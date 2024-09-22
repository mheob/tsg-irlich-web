import groq from 'groq';
import { sanityClient } from 'sanity:client';

interface Contact {
	contact: {
		address: string;
		email: string;
		phone: string;
	};
}

export async function getContact() {
	return sanityClient.fetch<Contact>(groq`*[_type == "site-settings"][0] { contact }`);
}
