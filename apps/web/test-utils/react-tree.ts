import { Children, isValidElement } from 'react';
import type { ElementType, ReactElement, ReactNode } from 'react';

/**
 * Collects every element of a given component type from a React element tree.
 *
 * An async server component returns its element tree without invoking any child component, so a
 * test can await the component itself and inspect the props it handed down — no DOM, no rendering
 * of the whole subtree, and no fixture for anything the page does not touch.
 *
 * @param node - The tree to search, usually the awaited return value of a server component.
 * @param type - The component to look for, imported from the same module the page imports.
 * @returns Every matching element, in the order they appear in the tree.
 */
function findElements<P>(node: ReactNode, type: ElementType<P>): ReactElement<P>[] {
	if (Array.isArray(node)) {
		return node.flatMap((child: ReactNode) => findElements(child, type));
	}

	if (!isValidElement(node)) {
		return [];
	}

	// `children` is the only prop that can carry more elements; everything else is data.
	const { children } = node.props as { children?: ReactNode };
	const nested = children === undefined ? [] : findElements(children, type);

	return node.type === type ? [node as ReactElement<P>, ...nested] : nested;
}

/**
 * Returns the first element of a given component type, or `undefined` when there is none.
 *
 * @param node - The tree to search.
 * @param type - The component to look for.
 * @returns The first matching element.
 */
function findElement<P>(node: ReactNode, type: ElementType<P>): ReactElement<P> | undefined {
	return findElements(node, type)[0];
}

/**
 * Lists the component or tag of every top-level element a page renders, in order. Unlike
 * `findElements`, this shows where one section sits relative to another.
 *
 * @param tree - The awaited return value of a page, usually a fragment around its sections.
 * @returns The type of every element directly inside it; `null` and `false` children are skipped.
 */
function sectionTypes(tree: ReactElement<{ children?: ReactNode }>): ElementType[] {
	return Children.toArray(tree.props.children).flatMap((child) =>
		isValidElement(child) ? [child.type as ElementType] : [],
	);
}

export { findElement, findElements, sectionTypes };
