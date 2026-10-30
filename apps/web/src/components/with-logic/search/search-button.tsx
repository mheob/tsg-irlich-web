import { Search } from 'lucide-react';
import type { Ref } from 'react';

import { cn } from '@tsgi-web/shared';

/**
 * The lupe in the navigation bar. It only asks to open the search; the bar holds the panel, which
 * is a modal dialog, hence `aria-haspopup="dialog"`.
 *
 * @param props - The button's props.
 * @param props.className - Where the bar shows it, the desktop or the mobile row.
 * @param props.onOpen - Called when the button is pressed.
 * @param props.ref - The button, so the focus can return to it when the panel closes.
 * @returns The button.
 */
function SearchButton({ className, onOpen, ref }: Readonly<SearchButtonProps>) {
	return (
		<button
			aria-haspopup="dialog"
			aria-label="Suche öffnen"
			className={cn(
				'inline-flex items-center justify-center rounded-full p-2 text-foreground transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
				className,
			)}
			onClick={onOpen}
			ref={ref}
			type="button"
		>
			<Search aria-hidden="true" className="size-6" />
		</button>
	);
}

interface SearchButtonProps {
	className?: string;
	onOpen: () => void;
	ref?: Ref<HTMLButtonElement>;
}

export { SearchButton };
