export const contactPersons = /* groq */ `
  firstName,
  lastName,
  phone,
  image,
  contactAs,
  "email": affiliations[0].role->email,
  "role": affiliations[0].role->title,
  "taskDescription": affiliations[0].taskDescription,
`;

export const meta = /* groq */ `meta { metaTitle, metaDescription, openGraphImage}`;

export const featuredImage = /* groq */ `featuredImage`;
