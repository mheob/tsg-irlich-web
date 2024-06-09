import { defineConfig } from 'sanity';

import { Logo } from './components/logo';
import { dataset, projectId } from './env';
import { getPlugins } from './plugins';
import { schemaTypes } from './schemas';

// Define the actions that should be available for singleton documents
const singletonActions = new Set(['publish', 'discardChanges', 'restore']);

// Define the singleton document types
const singletonTypes = new Set(['privacy', 'site-settings']);

export default defineConfig({
	dataset,
	document: {
		// For singleton types, filter out actions that are not explicitly included
		// in the `singletonActions` list defined above
		actions: (input, context) =>
			singletonTypes.has(context.schemaType)
				? input.filter(({ action }) => action && singletonActions.has(action))
				: input,
	},
	icon: Logo,
	name: 'default',
	plugins: getPlugins(),
	projectId,
	schema: {
		// Filter out singleton types from the global “New document” menu options
		templates: templates => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
		types: schemaTypes,
	},
	title: 'TSG Irlich 1882',
});
