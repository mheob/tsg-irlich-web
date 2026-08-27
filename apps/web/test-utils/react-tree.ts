import { isValidElement } from 'react';
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

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
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

export { findElement, findElements };
