'use client';

import { cn } from '@tsgi-web/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ComponentPropsWithoutRef, useState } from 'react';

import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

interface MobileLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, 'href'> {
	href: string;
	onOpenChange?: (open: boolean) => void;
}

function MobileLink({ className, href, onOpenChange, ...props }: Readonly<MobileLinkProps>) {
	const router = useRouter();
	return (
		<Link
			onClick={() => {
				router.push(href);
				onOpenChange?.(false);
			}}
			className={cn('text-base', className)}
			href={href}
			{...props}
		/>
	);
}

interface MobileNavProps {
	navigationItems: { _id: string; href: string; title: string }[];
}

export function MobileNav({ navigationItems }: Readonly<MobileNavProps>) {
	const [open, setOpen] = useState(false);

	return (
		<Drawer onOpenChange={setOpen} open={open}>
			<DrawerTrigger asChild>
				<button className="grid size-10 place-items-center md:hidden" type="button">
					<svg
						className="size-8"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M3.75 9h16.5m-16.5 6.75h16.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<span className="sr-only">Toggle Menu</span>
				</button>
			</DrawerTrigger>
			<DrawerContent className="max-h-[67svh] p-0">
				<DrawerTitle className="sr-only">Hauptnavigation</DrawerTitle>
				<div className="overflow-auto p-6">
					<div className="flex flex-col space-y-3">
						{navigationItems?.map(
							item =>
								item.href && (
									<MobileLink href={item.href} key={item._id} onOpenChange={() => setOpen(false)}>
										{item.title}
									</MobileLink>
								),
						)}
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
