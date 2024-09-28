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

interface MetaInformation {
	intro: string;
	metaDescription: string;
	metaTitle: string;
	title: string;
}

export async function getMetaInformation(slug: string) {
	return await sanityClient.fetch<MetaInformation>(
		groq`*[_type == $slug][0] {
				title,
				intro,
				'metaTitle': meta.metaTitle,
				'metaDescription': meta.metaDescription
			}
		`,
		{ slug: slug || 'home' },
	);
}
