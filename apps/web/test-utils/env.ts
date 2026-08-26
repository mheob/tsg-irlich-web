import { vi } from 'vitest';

/**
 * Imports a module with a fresh module registry and the given environment variables in place.
 *
 * `src/lib/env.ts` caches every validated value in a module level `Map`, so a test that needs a
 * different value has to reset the registry before importing the consumer.
 *
 * The caller must import the module under test as `import type` only — a value import binds a
 * live reference that survives `vi.resetModules()` and silently defeats this helper. See
 * `src/utils/url.test.ts` for the pattern.
 *
 * @param specifier - The module specifier to import, resolved the same way a static `import`
 * would resolve it (a `@/`-aliased path works, a path relative to this file does not).
 * @param vars - The environment variables to stub before importing, keyed by name.
 * @returns The freshly imported module.
 */
async function loadWithEnv<T>(
	specifier: string,
	vars: Record<string, string | undefined>,
): Promise<T> {
	vi.resetModules();
	vi.unstubAllEnvs();

	for (const [key, value] of Object.entries(vars)) {
		vi.stubEnv(key, value);
	}

	// A dynamic `import()` of a string specifier resolves to `any`; the caller supplies `T` to
	// name the module's real shape.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return (await import(specifier)) as T;
}

export { loadWithEnv };
