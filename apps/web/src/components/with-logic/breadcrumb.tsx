'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

import { getBreadcrumbItems, getBreadcrumbListSchema } from '@/utils/breadcrumb';
import type { BreadcrumbNames } from '@/utils/breadcrumb';
import { getOverviewPath } from '@/utils/pagination';

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
	/** The titles of the page and the pages above it, as the trail shows them. */
	names?: BreadcrumbNames;
	/**
	 * The same titles cleaned of the stega encoding draft mode adds, for the structured data. The
	 * visible trail keeps the encoding, and with it the click-to-edit overlays. Defaults to `names`.
	 */
	schemaNames?: BreadcrumbNames;
}

export default function Breadcrumb({
	baseUrl,
	names,
	schemaNames = names,
	...props
}: Readonly<BreadcrumbProps>) {
	// A later page of a cached overview is prerendered under its internal path, the browser shows its
	// public one. Both have to give the same trail, or the hydration fails.
	const pathname = getOverviewPath(usePathname());
	const items = getBreadcrumbItems(pathname, names);
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

			<JsonLd data={getBreadcrumbListSchema(baseUrl, getBreadcrumbItems(pathname, schemaNames))} />
		</>
	);
}
