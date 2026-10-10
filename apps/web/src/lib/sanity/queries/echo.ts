import { defineQuery } from 'next-sanity';

/** What the render route needs to claim a document and to check it is still its own. */
export const echoRenderStateQuery = defineQuery(`
	*[_id == $id][0] {
		_id,
		_rev,
		"pdfRef": pdf.asset._ref,
		"renderSource": render.source,
		"renderStartedAt": render.startedAt
	}
`);
