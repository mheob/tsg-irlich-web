import { Slot } from '@radix-ui/react-slot';
import type { LucideProps } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/utils';

import { ArrowButton } from './arrow-button';

interface ArrowButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
	asChild?: boolean;
	size?: LucideProps['size'];
}

export default function ArrowButtonGroup({
	asChild = false,
	className,
	size = '48',
	...props
}: Readonly<ArrowButtonGroupProps>) {
	const Comp = asChild ? Slot : 'div';

	return (
		<Comp className={cn('flex items-center justify-center gap-4', className)} {...props}>
			<ArrowButton direction="left" size={size} variant="ghost" />
			<ArrowButton direction="right" size={size} variant="secondary" />
		</Comp>
	);
}
