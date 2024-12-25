'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ComponentPropsWithoutRef, Fragment } from 'react';

import { capitalizeWords } from '@/utils/typography';

import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Breadcrumb as ShadcnBreadcrumb,
} from '../ui/breadcrumb';

function getBreadcrumbItemsPaths(pathname: string) {
	const breadcrumbItems = pathname.split('/').slice(1);

	let breadcrumbItemsPathsLast = '';
	const breadcrumbItemsPaths = breadcrumbItems.slice(0, -1).map(item => {
		const path = `${breadcrumbItemsPathsLast}/${item}`;
		breadcrumbItemsPathsLast = `/${item}`;
		return { path, title: capitalizeWords(item) };
	});

	return breadcrumbItemsPaths;
}

interface BreadcrumbProps extends ComponentPropsWithoutRef<typeof ShadcnBreadcrumb> {
	currentPage?: string;
}

export default function Breadcrumb({ currentPage, ...props }: Readonly<BreadcrumbProps>) {
	const pathname = usePathname();
	const breadcrumbItemsPaths = getBreadcrumbItemsPaths(pathname);

	return (
		<ShadcnBreadcrumb className="mt-8" {...props}>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link href="/">Home</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>

				{breadcrumbItemsPaths.map(item => (
					<Fragment key={item.path}>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link href={item.path}>{item.title}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</Fragment>
				))}

				<BreadcrumbSeparator />

				<BreadcrumbItem>
					<BreadcrumbPage>{currentPage ?? breadcrumbItemsPaths.at(-1)?.title}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</ShadcnBreadcrumb>
	);
}
