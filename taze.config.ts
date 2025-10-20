import { defineConfig } from 'taze';

export default defineConfig({
	depFields: {
		'pnpm.overrides': false,
	},
	packageMode: {
		'lucide-react': 'latest',
	},
});
