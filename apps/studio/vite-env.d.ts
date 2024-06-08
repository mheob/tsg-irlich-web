/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly SANITY_API_DATASET: string;
	readonly SANITY_API_PROJECT_ID: string;
	readonly SANITY_API_READ_TOKEN: string;
	readonly SANITY_API_WRITE_TOKEN: string;
	readonly SANITY_STUDIO_DATASET: string;
	readonly SANITY_STUDIO_PROJECT_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
