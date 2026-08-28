import { cn } from '@tsgi-web/shared';

export const textClassName = cn(
	'[&>h2]:mt-8 [&>h2]:mb-6 [&>h2]:text-3xl',
	'[&>h3]:mt-8 [&>h3]:mb-6 [&>h3]:text-2xl',
	'[&>p]:my-4 [&>p]:text-lg',
	'[&_*>a]:break-all [&_*>a]:text-primary-light [&_*>a]:underline [&_*>a]:hover:text-primary md:[&_*>a]:break-normal',
);
