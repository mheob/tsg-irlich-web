'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ComponentPropsWithoutRef, Fragment } from 'react';

import { capitalizeString } from '@/utils/typography';

import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Breadcrumb as ShadcnBreadcrumb,
} from '../ui/breadcrumb';

interface BreadcrumbProps extends ComponentPropsWithoutRef<typeof ShadcnBreadcrumb> {
	currentPage?: string;
}

export default function Breadcrumb({ currentPage, ...props }: Readonly<BreadcrumbProps>) {
	const pathname = usePathname();

	const breadcrumbItems = pathname.split('/').slice(1);

	return (
		<ShadcnBreadcrumb className="mt-8" {...props}>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link href="/">Home</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>

				{breadcrumbItems.slice(0, -1).map(item => (
					<Fragment key={item}>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link href={`/${item}`}>{capitalizeString(item)}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</Fragment>
				))}

				<BreadcrumbSeparator />

				<BreadcrumbItem>
					<BreadcrumbPage>{currentPage ?? breadcrumbItems.at(-1)}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</ShadcnBreadcrumb>
	);
}
