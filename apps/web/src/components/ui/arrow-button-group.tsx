import { Slot } from '@radix-ui/react-slot';
import type { LucideProps } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

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
			<ArrowButton aria-label="Zurück" direction="left" size={size} variant="ghost" />
			<ArrowButton aria-label="Weiter" direction="right" size={size} variant="secondary" />
		</Comp>
	);
}
