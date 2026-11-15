import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

// A plain text input. The version bound to a react-hook-form field is `InputWithLabel` in its own
// file, so this one stays free of the form library (WEB-448).
function Input({ className, type, ...props }: ComponentProps<'input'>) {
	return (
		<input
			className={cn(
				'flex w-full min-w-0 rounded-md bg-background-high-contrast px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-secondary file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-xl',
				'focus-visible:ring-[3px] focus-visible:ring-ring',
				// An inset ring marks an invalid field without a border that would change its size.
				'aria-invalid:inset-ring-2 aria-invalid:inset-ring-destructive-foreground',
				className,
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}

export { Input };
