import { cn } from '@tsgi-web/shared';
import type { ComponentPropsWithRef, HTMLAttributes } from 'react';
import type { FieldValues } from 'react-hook-form';

import { FormControl, FormItem, FormLabel, FormMessage } from '../with-logic/form';

export function Textarea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
	return (
		<textarea
			className={cn(
				'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 bg-background-high-contrast aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex min-h-[7lh] w-full resize-y rounded-md px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-xl',
				className,
			)}
			{...props}
		/>
	);
}

interface TextareaWithLabelProps extends ComponentPropsWithRef<typeof Textarea> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	field?: FieldValues;
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

export function TextareaWithLabel({
	children,
	field,
	wrapperClassName,
	...props
}: Readonly<TextareaWithLabelProps>) {
	return (
		<FormItem className={wrapperClassName}>
			<FormLabel>{children}</FormLabel>
			<FormControl>
				<Textarea {...field} {...props} />
			</FormControl>
			<FormMessage />
		</FormItem>
	);
}
