export const contactPersons = /* groq */ `
		firstName,
		lastName,
		phone,
		image,
		"email": affiliations[department->title == $department][0].role->email,
		"role": affiliations[department->title == $department][0].role->title,
		"vision": affiliations[department->title == $department][0].description,
`;
