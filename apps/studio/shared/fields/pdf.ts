/**
 * Rejects a file whose asset is not a PDF. An empty field passes, because requiring a file is the
 * job of `Rule.required()`.
 *
 * @param file - The value of a `file` field.
 * @returns `true`, or the German message the studio shows.
 */
function validatePdfFile(file?: { asset?: unknown }): true | string {
	if (!file) {
		return true;
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the upload widget stores the asset with its mime type
	const asset = file.asset as { mimeType?: string } | undefined;
	return asset?.mimeType && asset.mimeType !== 'application/pdf'
		? 'Nur PDF-Dateien sind erlaubt'
		: true;
}

export { validatePdfFile };
