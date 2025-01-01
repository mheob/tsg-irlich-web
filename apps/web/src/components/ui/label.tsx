'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils/cn';

const labelVariants = cva(
	'flex items-center gap-2 text-lg peer-disabled:cursor-not-allowed peer-disabled:opacity-70 md:text-2xl',
);

const Label = ({
	className,
	...props
}: ComponentPropsWithRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>) => (
	<LabelPrimitive.Root className={cn(labelVariants(), className)} {...props} />
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
