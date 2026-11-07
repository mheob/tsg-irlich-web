import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';

import { cn } from '@tsgi-web/shared';

import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '../with-logic/form';

function Textarea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
	return (
		<textarea
			className={cn(
				'flex min-h-[7lh] w-full resize-y rounded-md bg-background-high-contrast px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:inset-ring-2 aria-invalid:inset-ring-destructive-foreground md:text-xl',
				className,
			)}
			{...props}
		/>
	);
}

interface TextareaWithLabelProps extends ComponentPropsWithRef<typeof Textarea> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	description?: ReactNode;
	field?: FieldValues;
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

function TextareaWithLabel({
	children,
	description,
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
			{description && <FormDescription className="max-w-none px-3">{description}</FormDescription>}
			<FormMessage />
		</FormItem>
	);
}

export { Textarea, TextareaWithLabel };
