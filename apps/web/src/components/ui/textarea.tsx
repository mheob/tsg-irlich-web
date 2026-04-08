import type { ComponentPropsWithRef, HTMLAttributes } from 'react';
import type { FieldValues } from 'react-hook-form';

import { cn } from '@tsgi-web/shared';

import { FormControl, FormItem, FormLabel, FormMessage } from '../with-logic/form';

function Textarea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
	return (
		<textarea
			className={cn(
				'flex min-h-[7lh] w-full resize-y rounded-md bg-background-high-contrast px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-xl',
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

function TextareaWithLabel({
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

export { Textarea, TextareaWithLabel };
