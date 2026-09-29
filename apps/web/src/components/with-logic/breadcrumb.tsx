'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

import { getBreadcrumbItems, getBreadcrumbListSchema } from '@/utils/breadcrumb';

import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Breadcrumb as ShadcnBreadcrumb,
} from '../ui/breadcrumb';
import { JsonLd } from '../ui/json-ld';

const LAST_INDEX = -1;

interface BreadcrumbProps extends ComponentPropsWithoutRef<typeof ShadcnBreadcrumb> {
	/** The site's base URL, which the structured data needs for absolute links. */
	baseUrl: string;
	currentPage?: string;
}

export default function Breadcrumb({ baseUrl, currentPage, ...props }: Readonly<BreadcrumbProps>) {
	const pathname = usePathname();
	const items = getBreadcrumbItems(pathname, currentPage);
	const page = items.at(LAST_INDEX);

	return (
		<>
			<ShadcnBreadcrumb className="mt-8" {...props}>
				<BreadcrumbList>
					{items.slice(0, LAST_INDEX).map((item, index) => (
						<Fragment key={item.path}>
							{index > 0 && <BreadcrumbSeparator />}
							<BreadcrumbItem>
								<BreadcrumbLink render={<Link href={item.path} />}>{item.name}</BreadcrumbLink>
							</BreadcrumbItem>
						</Fragment>
					))}

					<BreadcrumbSeparator />

					<BreadcrumbItem>
						<BreadcrumbPage>{page?.name}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</ShadcnBreadcrumb>

			<JsonLd data={getBreadcrumbListSchema(baseUrl, items)} />
		</>
	);
}
