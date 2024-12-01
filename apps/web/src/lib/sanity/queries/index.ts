import { defineQuery } from 'next-sanity';

export const contactPersons = /* groq */ `
		firstName,
		lastName,
		phone,
		image,
		"email": affiliations[department->title == $department][0].role->email,
		"role": affiliations[department->title == $department][0].role->title,
		"vision": affiliations[department->title == $department][0].description,
`;

export const featuredImage = /* groq */ `featuredImage`;

export const socialMediaQuery = defineQuery(`*[_type == 'site-settings'][0].socialFields`);
