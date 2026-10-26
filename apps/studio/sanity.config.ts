import { defineConfig } from 'sanity';

import { createDuplicateWithoutSlugHistoryAction } from './actions/duplicate-without-slug-history';
import { createPublishWithSlugHistoryAction } from './actions/publish-with-slug-history';
import { RegenerateEchoPagesAction } from './actions/regenerate-echo-pages';
import { Logo } from './components/logo';
import { dataset, projectId } from './env';
import { getPlugins } from './plugins';
import { schemaTypes } from './schemas';
import echoIssue from './schemas/documents/echo.issue';
import { groupByDepartmentTemplate } from './structure/templates';

// Define the actions that should be available for singleton documents
const singletonActions = new Set(['publish', 'discardChanges', 'restore']);

// Define the singleton document types
const singletonTypes = new Set(['privacy', 'site-settings']);

// Define the document types whose publish action remembers former slugs, so old URLs can redirect,
// and whose duplicate action leaves that history behind, so a copy cannot take over the redirects
const slugHistoryTypes = new Set(['department', 'group']);

export default defineConfig({
	dataset,
	document: {
		// For singleton types, filter out actions that are not explicitly included
		// In the `singletonActions` list defined above
		actions: (input, context) => {
			if (singletonTypes.has(context.schemaType)) {
				return input.filter(({ action }) => action && singletonActions.has(action));
			}
			if (context.schemaType === echoIssue.name) {
				return [...input, RegenerateEchoPagesAction];
			}
			if (slugHistoryTypes.has(context.schemaType)) {
				return input.map((action) => {
					if (action.action === 'publish') {
						return createPublishWithSlugHistoryAction(action);
					}
					if (action.action === 'duplicate') {
						return createDuplicateWithoutSlugHistoryAction(action);
					}
					return action;
				});
			}
			return input;
		},
	},
	form: {
		// Disable the default for file assets
		file: {
			assetSources: (sources) => sources.filter((source) => source.name !== 'sanity-default'),
		},
		// Disable the default for image assets (use sanity-plugin-media only)
		image: {
			assetSources: (sources) => sources.filter((source) => source.name !== 'sanity-default'),
		},
	},
	icon: Logo,
	name: 'default',
	plugins: getPlugins(),
	projectId,
	schema: {
		// Filter out singleton types from the global “New document” menu options, then add the template
		// behind "Neu" in the groups of a department
		templates: (templates) => [
			...templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
			groupByDepartmentTemplate,
		],
		types: schemaTypes,
	},
	title: 'TSG Irlich 1882',
});
