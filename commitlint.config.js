import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import defaultConfig from '@mheob/commitlint-config';

const currentPath = path.dirname(fileURLToPath(import.meta.url));

function getScopes() {
	const defaultScopes = ['deps', 'release', 'repo'];

	const appsPath = path.resolve(currentPath, 'apps');
	const apps = existsSync(appsPath) ? readdirSync(appsPath) : [];

	const packagesPath = path.resolve(currentPath, 'packages');
	const packages = existsSync(packagesPath) ? readdirSync(packagesPath) : [];

	return [...defaultScopes, ...apps, ...packages];
}

// eslint-disable-next-line jsdoc/check-tag-names
/** @type {import('@mheob/commitlint-config').UserConfig} */
const config = {
	...defaultConfig,
	prompt: {
		...defaultConfig.prompt,
		scopes: getScopes(),
	},
};

export default config;
