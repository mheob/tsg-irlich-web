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

/**
 * Everything `getInternalHref` needs to build the path of a linked document. The slug alone is not
 * enough, because it only holds the last segment of the URL.
 */
const internalLinkTarget = /* groq */ `
  _type,
  "slug": slug.current,
  "category": categories[0]->slug.current
`;

/**
 * The marks of a portable text block, with the target of every internal link resolved.
 *
 * The resolved target is added as `target` instead of replacing the `link` reference, so that the
 * result still matches the generated schema types. Empty arrays are coalesced for the same reason:
 * a projection turns a missing attribute into `null`, which the schema types do not allow.
 */
const markDefsWithLinks = /* groq */ `
  "markDefs": coalesce(markDefs[] {
    ...,
    _type == "internalLink" => { "target": link-> { ${internalLinkTarget} } }
  }, [])
`;

/** A `blockContent` object, with the target of every internal link inside its text resolved. */
const blockContent = /* groq */ `
  ...,
  "text": coalesce(text[] { ..., ${markDefsWithLinks} }, [])
`;

export { blockContent, contactPersons, featuredImage, internalLinkTarget, markDefsWithLinks, meta };
