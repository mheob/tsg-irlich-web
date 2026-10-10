const contactPersons = /* groq */ `
  _id,
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

/**
 * A TSG-Echo issue the website shows: its pages are rendered from the PDF it carries now, and it has
 * a slug. Pending, failed and never-rendered issues stay off the site, which also hides the pages a
 * failed run keeps from the previous PDF. So does an issue whose PDF was swapped and not yet claimed
 * by a render, whose `done` still describes the previous PDF.
 */
const finishedEchoIssue = /* groq */ `_type == 'echo.issue' && render.status == 'done' && render.source == pdf.asset._ref && defined(slug.current) && count(pages) > 0`;

export {
	blockContent,
	contactPersons,
	featuredImage,
	finishedEchoIssue,
	internalLinkTarget,
	markDefsWithLinks,
	meta,
};
