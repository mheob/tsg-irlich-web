/**
 * The first focusable element of every page: a link past the navigation, straight to the content
 * (WCAG 2.4.1). It stays visually hidden until it takes the focus, then shows above the fixed bar.
 *
 * The target carries `tabIndex={-1}`, so following the link moves the focus onto it rather than only
 * scrolling there, and the next Tab starts inside the content instead of in the navigation.
 *
 * @param props - The link's props.
 * @param props.targetId - The id of the element that holds the content of the page.
 * @returns The skip link.
 */
function SkipLink({ targetId }: Readonly<SkipLinkProps>) {
	return (
		<a
			className="fixed top-4 left-4 z-60 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg outline-none not-focus:sr-only focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			href={`#${targetId}`}
		>
			Zum Inhalt springen
		</a>
	);
}

interface SkipLinkProps {
	targetId: string;
}

export { SkipLink };
