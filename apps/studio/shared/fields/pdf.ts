/** A file asset reference ends in the file's extension: `file-<sha1>-pdf`. */
const PDF_ASSET_REF = /-pdf$/iu;
const MESSAGE = 'Nur PDF-Dateien sind erlaubt';

/**
 * Rejects a file whose asset is not a PDF. An empty field passes, because requiring a file is the
 * job of `Rule.required()`. The stored value usually carries only the asset reference, so its
 * extension decides; a mime type, where the upload widget provides one, decides first.
 *
 * @param file - The value of a `file` field.
 * @returns `true`, or the German message the studio shows.
 */
function validatePdfFile(file?: { asset?: unknown }): true | string {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the field stores a reference, the upload widget adds the mime type
	const asset = file?.asset as { _ref?: string; mimeType?: string } | undefined;
	if (asset?.mimeType) {
		return asset.mimeType === 'application/pdf' ? true : MESSAGE;
	}
	if (asset?._ref) {
		return PDF_ASSET_REF.test(asset._ref) ? true : MESSAGE;
	}
	return true;
}

export { validatePdfFile };
