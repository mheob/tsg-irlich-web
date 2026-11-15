import type { NodePatch } from 'sanity/migrate';
import { at, defineMigration, unset } from 'sanity/migrate';

/**
 * Reads the vision section of the club page's content without trusting its shape.
 *
 * @param content - The `content` field of the club page.
 * @returns The vision section, or `undefined` when the content holds none.
 */
function getVisionSection(content: unknown): object | undefined {
	if (typeof content !== 'object' || content === null || !('visionSection' in content)) {
		return undefined;
	}

	const { visionSection } = content;

	return typeof visionSection === 'object' && visionSection !== null ? visionSection : undefined;
}

/**
 * Removes the long vision from the club page (WEB-150): its text moved to the values page
 * `/verein/werte`, and the button of the vision section links there instead of opening a dialog.
 * Run it only after `scripts/create-values-page.ts`, which reads the long vision to fill the start
 * content of the values page, and only once the website that no longer shows the dialog is live.
 */
export default defineMigration({
	documentTypes: ['aboutUs'],
	migrate: {
		document({ content }) {
			const vision = getVisionSection(content);
			const patches: NodePatch[] = [];

			if (vision && 'longVision' in vision) {
				patches.push(at('content.visionSection.longVision', unset()));
			}
			if (vision && 'longVisionTitle' in vision) {
				patches.push(at('content.visionSection.longVisionTitle', unset()));
			}

			return patches;
		},
	},
	title: 'Lange Vision der Vereinsseite entfernen',
});
