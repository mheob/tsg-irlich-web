// cspell:word timediff

import { defineConfig } from 'taze';

export default defineConfig({
	depFields: {
		overrides: false,
	},
	includeLocked: true,
	interactive: true,
	packageMode: {
		'lucide-react': 'latest',
	},
	peer: true,
	recursive: true,
});
