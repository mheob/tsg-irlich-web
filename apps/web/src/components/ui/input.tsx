import type { ComponentPropsWithRef, HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

const Input = ({ className, type, ...props }: ComponentPropsWithRef<'input'>) => (
	<input
		className={cn(
			'file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring bg-background-high-contrast focus-visible:outline-hidden flex w-full rounded-md px-4 py-2 text-xl transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
			className,
		)}
		type={type}
		{...props}
	/>
);
Input.displayName = 'Input';

interface InputWithLabelProps extends ComponentPropsWithRef<typeof Input> {
	children?: HTMLAttributes<HTMLLabelElement>['children'];
	wrapperClassName?: HTMLAttributes<HTMLDivElement>['className'];
}

function InputWithLabel({ children, wrapperClassName, ...props }: Readonly<InputWithLabelProps>) {
	return (
		<div className={cn('flex flex-col gap-4', wrapperClassName)}>
			<label className="flex items-center gap-2 text-2xl" htmlFor={props.id}>
				{children}
			</label>
			<Input {...props} />
		</div>
	);
}

export { Input, InputWithLabel };
