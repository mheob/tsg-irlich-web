type SanityResultWrapper<T> = T extends null
	? undefined
	: T extends (infer U)[]
		? SanityResultWrapper<U>[]
		: T extends Record<string, unknown>
			? { [K in keyof T]: SanityResultWrapper<T[K]> }
			: T;

/**
 * A utility type that wraps Sanity query results to ensure they are readonly and non-nullable.
 *
 * @template T - The type of the Sanity query result
 * @returns A readonly version of the query result with null/undefined values removed
 *
 * @example
 * ```ts
 * // Define a Sanity query result type
 * type HeroResult = { title: string | null; intro: string | null };
 *
 * // Wrap it to get a safe type for use in components
 * type Hero = SanityResult<HeroResult>;
 * // Results in: { readonly title: string; readonly intro: string }
 * ```
 */
export type SanityResult<T> = Readonly<NonNullable<SanityResultWrapper<T>>>;
