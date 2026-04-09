// oxlint-disable no-inline-comments

const contactPersons = /* groq */ `
  firstName,
  lastName,
  phone,
  image,
  contactAs,
  "email": affiliations[0].role->email,
  "role": affiliations[0].role->title,
  "taskDescription": affiliations[0].taskDescription,
`;

const meta = /* groq */ `meta { metaTitle, metaDescription, openGraphImage}`;

const featuredImage = /* groq */ `featuredImage`;

export { contactPersons, meta, featuredImage };
