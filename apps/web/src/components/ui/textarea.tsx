import { type ComponentProps, forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(
	({ className, ...props }, reference) => {
		return (
			<textarea
				className={cn(
					'placeholder:text-muted-foreground focus-visible:ring-ring bg-background-high-contrast focus-visible:outline-hidden flex min-h-[60px] w-full rounded-md px-4 py-2 text-xl focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
					className,
				)}
				ref={reference}
				{...props}
			/>
		);
	},
);
Textarea.displayName = 'Textarea';

interface TextareaWithLabelProps extends ComponentProps<typeof Textarea> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

function TextareaWithLabel({
	children,
	wrapperClassName,
	...props
}: Readonly<TextareaWithLabelProps>) {
	return (
		<div className={cn('flex flex-col gap-4', wrapperClassName)}>
			<label className="flex items-center gap-2 text-2xl" htmlFor={props.id}>
				{children}
			</label>
			<Textarea {...props} />
		</div>
	);
}

export { Textarea, TextareaWithLabel };
