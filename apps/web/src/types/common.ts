/**
 * Type for Next.js page component props that include route parameters.
 *
 * @template T - Additional props to extend the base page props
 * @property params - Route parameters containing the slug
 * @returns Union of route params and generic type T
 *
 * @example
 * ```ts
 * // Basic usage for a dynamic page component
 * export default function Page({ params }: PageProps<{}>) {
 *   const { slug } = params;
 *   return <div>{slug}</div>
 * }
 * ```
 */
export type PageProps<T = object> = T & {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
