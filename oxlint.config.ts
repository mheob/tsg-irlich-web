import { baseConfig, tailwindcssConfig } from '@mheob/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
	extends: [baseConfig, tailwindcssConfig],
});
