import { toNumber } from '../_shared/numbers';

/**
 * The list of the values next to them. From the desktop on it runs along while the reader scrolls
 * (`sticky`); on a phone it is a row of pills that scrolls sideways above the first value.
 *
 * @param props - The heading and the entries.
 * @param props.entries - Title and anchor of every value, in their order.
 * @param props.title - The heading of the list, which also names the navigation landmark.
 * @returns The navigation.
 */
function TableOfContents({ entries, title }: Readonly<TableOfContentsProps>) {
	return (
		<nav
			aria-label={title}
			className="-mx-(--padding-container) overflow-x-auto px-(--padding-container) lg:sticky lg:top-28 lg:mx-0 lg:self-start lg:overflow-visible lg:px-0"
		>
			<p className="hidden font-sans-serif text-sm font-bold text-muted-foreground uppercase lg:block">
				{title}
			</p>
			<ol className="flex gap-2 lg:mt-4 lg:flex-col lg:gap-1 lg:border-l-2 lg:border-border">
				{entries.map((entry, index) => (
					<li className="shrink-0" key={entry.anchor}>
						<a
							className="flex items-baseline gap-3 rounded-full bg-background-low-contrast px-4 py-2 text-sm font-semibold hover:text-primary lg:-ml-0.5 lg:rounded-none lg:border-l-2 lg:border-transparent lg:bg-transparent lg:py-1.5 lg:hover:border-secondary"
							href={`#${entry.anchor}`}
						>
							<span aria-hidden="true" className="font-serif text-lg text-primary-light">
								{toNumber(index)}
							</span>
							{entry.title}
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
}

interface TableOfContentsProps {
	entries: readonly { anchor: string; title: string }[];
	title: string;
}

export { TableOfContents };
