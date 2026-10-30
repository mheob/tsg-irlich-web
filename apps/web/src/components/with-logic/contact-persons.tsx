import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@tsgi-web/shared';

import type { ContactPerson } from '@/types/sanity.types';

import { ContactButton } from '../ui/contact-button';
import { Portrait } from '../ui/portrait';

const IMAGE_SIZE = { desktop: 176, mobile: 120 };

interface ContactPersonItemProps
	extends ContactPerson, Omit<ComponentPropsWithoutRef<'article'>, 'role'> {}

function ContactPersonItem({
	contactAs,
	email,
	firstName,
	image,
	lastName,
	phone,
	role,
	taskDescription,
}: Readonly<ContactPersonItemProps>) {
	const showPhone = phone && (contactAs === 'phone' || contactAs === 'both');
	const showWhatsapp = phone && (contactAs === 'whatsapp' || contactAs === 'both');

	return (
		<article>
			<Portrait
				className={cn(
					'z-1 size-30 border-5 border-primary bg-secondary-light text-6xl',
					'md:size-44 md:border-8',
				)}
				firstName={firstName}
				image={image}
				lastName={lastName}
				sizes={`(max-width: 48rem) ${IMAGE_SIZE.mobile}px, ${IMAGE_SIZE.desktop}px`}
				sourceSize={IMAGE_SIZE.desktop}
			/>

			<div className="-mt-24 ml-8 flex h-full flex-col gap-4 rounded-xl bg-background text-black md:-mt-36 md:gap-12">
				<header className="pt-6 pr-12 pl-28 md:pl-40">
					<h3 className="font-serif text-2xl md:text-4xl">
						{firstName} {lastName}
					</h3>
					<p className="mb-2 text-sm md:text-lg">{role}</p>
					<div className="flex gap-6">
						{email && <ContactButton email={email} />}
						{showPhone && <ContactButton phone={phone} />}
						{showWhatsapp && <ContactButton whatsapp={phone} />}
					</div>
				</header>

				<p className="px-5 text-sm md:px-12 md:text-xl">{taskDescription}</p>
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
				{ 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3': cpLength % 3 === 0 },
				{ 'grid-cols-1 lg:grid-cols-2': cpLength % 3 !== 0 && cpLength % 2 === 0 },
				{ 'grid-cols-1': cpLength % 3 !== 0 && cpLength % 2 !== 0 && cpLength % 1 === 0 },
			)}
		>
			{contactPersons.map((props) => (
				<ContactPersonItem key={props._id} {...props} />
			))}
		</div>
	);
}
