import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import defaultConfig from '@mheob/commitlint-config';

const currentPath = dirname(fileURLToPath(import.meta.url));

function getScopes() {
	const defaultScopes = ['deps', 'release', 'repo'];

	const appsPath = resolve(currentPath, 'apps');
	const apps = existsSync(appsPath) ? readdirSync(appsPath) : [];

	const packagesPath = resolve(currentPath, 'packages');
	const packages = existsSync(packagesPath) ? readdirSync(packagesPath) : [];

	return [...defaultScopes, ...apps, ...packages];
}

/** @type {import('@mheob/commitlint-config').UserConfig} */
const config = {
	...defaultConfig,
	prompt: {
		...defaultConfig.prompt,
		scopes: getScopes(),
	},
};

export default config;
