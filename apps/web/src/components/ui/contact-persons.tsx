'use client';

import { cn } from '@tsgi-web/shared';
import Image from 'next/image';
import type { ComponentPropsWithoutRef } from 'react';

import { useMediaQuery } from '@/hooks/use-media-query';
import { urlForImage } from '@/lib/sanity/utils';
import type { ContactPerson } from '@/types/sanity.types';
import { getInitials } from '@/utils/image';

import { ContactButton } from './contact-button';

interface ContactPersonItemProps
	extends ContactPerson,
		Omit<ComponentPropsWithoutRef<'article'>, 'role'> {}

function ContactPersonItem({
	email,
	firstName,
	image,
	lastName,
	phone,
	role,
	vision,
}: Readonly<ContactPersonItemProps>) {
	const isMobile = useMediaQuery('(max-width: 48rem)');

	const imageSource = isMobile ? urlForImage(image, 120) : urlForImage(image, 176);

	return (
		<article>
			{imageSource ? (
				<Image
					className={cn(
						'bg-secondary-light text-primary border-primary',
						'z-1 relative grid place-items-center',
						'border-5 rounded-full md:border-8',
					)}
					alt={image.alt}
					height={isMobile ? 120 : 176}
					src={imageSource}
					width={isMobile ? 120 : 176}
				/>
			) : (
				<div
					className={cn(
						'bg-secondary text-primary border-primary',
						'z-1 relative grid place-items-center',
						'border-5 rounded-full md:border-8',
						'size-32 text-6xl font-bold md:size-44',
					)}
				>
					{getInitials(firstName, lastName)}
				</div>
			)}

			<div className="-mt-24 ml-8 flex h-full flex-col gap-4 rounded-xl bg-white text-black md:-mt-36 md:gap-12">
				<header className="pl-28 pr-12 pt-6 md:pl-40">
					<h3 className="font-serif text-2xl md:text-3xl">
						{firstName} {lastName}
					</h3>
					<p className="mb-2 text-sm md:text-lg">{role}</p>
					<div className="flex gap-6">
						{email && <ContactButton email={email} />}
						{phone && <ContactButton phone={phone} />}
					</div>
				</header>

				<p className="px-5 text-sm md:px-12 md:text-xl">{vision}</p>
			</div>
		</article>
	);
}

interface ContactPersonsProps {
	contactPersons: ComponentPropsWithoutRef<typeof ContactPersonItem>[];
}

export function ContactPersons({ contactPersons }: Readonly<ContactPersonsProps>) {
	const cpLength = contactPersons.length;

	return (
		<div
			className={cn(
				'grid items-stretch gap-x-8 gap-y-20',
				{ 'grid-cols-1 md:grid-cols-3': cpLength % 3 === 0 },
				{ 'grid-cols-1 md:grid-cols-2': cpLength % 3 !== 0 && cpLength % 2 === 0 },
				{ 'grid-cols-1': cpLength % 3 !== 0 && cpLength % 2 !== 0 && cpLength % 1 === 0 },
			)}
		>
			{contactPersons.map(props => (
				<ContactPersonItem key={props.lastName} {...props} />
			))}
		</div>
	);
}
