import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils/cn';

const Separator = ({
	className,
	decorative = true,
	orientation = 'horizontal',
	...props
}: ComponentPropsWithRef<typeof SeparatorPrimitive.Root>) => (
	<SeparatorPrimitive.Root
		className={cn(
			'bg-border shrink-0',
			orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
			className,
		)}
		decorative={decorative}
		orientation={orientation}
		{...props}
	/>
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
