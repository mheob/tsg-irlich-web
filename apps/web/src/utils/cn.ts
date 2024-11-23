import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes efficiently.
 * Uses clsx for conditional class names and tailwind-merge to handle Tailwind class conflicts.
 *
 * @param inputs - Array of class values that can include strings, objects, arrays, etc.
 * @returns Merged and deduplicated class string
 * @example
 * cn('p-4', 'bg-blue-500', { 'text-white': true }) // 'p-4 bg-blue-500 text-white'
 * cn('p-2 p-4') // 'p-4' (deduplicates conflicting classes)
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
