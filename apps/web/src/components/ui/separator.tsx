import { Separator as BaseSeparator } from '@base-ui/react/separator';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

function Separator({
	className,
	decorative = true,
	orientation = 'horizontal',
	...props
}: Readonly<SeparatorProps>) {
	return (
		<BaseSeparator
			aria-orientation={decorative ? undefined : orientation}
			className={cn(
				`shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px`,
				className,
			)}
			data-slot="separator"
			orientation={orientation}
			role={decorative ? 'none' : 'separator'}
			{...props}
		/>
	);
}

interface SeparatorProps extends ComponentProps<typeof BaseSeparator> {
	/**
	 * Whether the separator is purely visual. A decorative separator is skipped by assistive
	 * technology; a non-decorative one is announced as a separator with its orientation.
	 *
	 * Base UI's `Separator` has no such prop and always renders `role="separator"`, so the role and
	 * `aria-orientation` are overridden here — the same distinction Radix's `decorative` made.
	 */
	decorative?: boolean;
}

export { Separator };
