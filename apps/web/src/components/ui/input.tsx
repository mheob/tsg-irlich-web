import { cn } from '@tsgi-web/shared';
import type { ComponentProps, HTMLAttributes } from 'react';
import type { FieldValues } from 'react-hook-form';

import { FormControl, FormItem, FormLabel, FormMessage } from '../with-logic/form';

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
	return (
		<input
			className={cn(
				'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-secondary bg-background-high-contrast flex w-full min-w-0 rounded-md px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-xl',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
				'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
				className,
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}

interface InputWithLabelProps extends ComponentProps<typeof Input> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	field?: FieldValues;
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

export function InputWithLabel({
	children,
	field,
	wrapperClassName,
	...props
}: Readonly<InputWithLabelProps>) {
	return (
		<FormItem className={wrapperClassName}>
			<FormLabel>{children}</FormLabel>
			<FormControl>
				<Input {...field} {...props} />
			</FormControl>
			<FormMessage />
		</FormItem>
	);
}
