'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

import { capitalizeWords } from '@/utils/typography';

import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Breadcrumb as ShadcnBreadcrumb,
} from '../ui/breadcrumb';

const LAST_INDEX = -1;

function getBreadcrumbItemsPaths(pathname: string) {
	const breadcrumbItems = pathname.split('/').slice(1);

	let breadcrumbItemsPathsLast = '';
	const breadcrumbItemsPaths = breadcrumbItems.slice(0, LAST_INDEX).map((item) => {
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
					<BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
				</BreadcrumbItem>

				{breadcrumbItemsPaths.map((item) => (
					<Fragment key={item.path}>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink render={<Link href={item.path} />}>{item.title}</BreadcrumbLink>
						</BreadcrumbItem>
					</Fragment>
				))}

				<BreadcrumbSeparator />

				<BreadcrumbItem>
					<BreadcrumbPage>
						{currentPage ?? breadcrumbItemsPaths.at(LAST_INDEX)?.title}
					</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</ShadcnBreadcrumb>
	);
}
