import Image from 'next/image';
import type { ComponentProps } from 'react';

import { cn } from '@/utils';
import { getInitials } from '@/utils/image';

import ContactButton from './contact-button';

interface ContactPersonItemProps {
	email: string;
	firstName: string;
	// image: SanityImage;
	imageSrc: string;
	lastName: string;
	phone: string;
	role: string;
	vision: string;
}

function ContactPersonItem({
	email,
	firstName,
	imageSrc,
	lastName,
	phone,
	role,
	vision,
}: ContactPersonItemProps) {
	// const imageSrc = urlFor(image, 176).url();

	return (
		<article>
			{imageSrc ? (
				<Image
					className={cn(
						'bg-secondary-light text-primary border-primary',
						'relative z-[1] grid place-items-center',
						'rounded-full border-8',
					)}
					// alt={image.alt as string}
					alt={lastName}
					height={176}
					src={imageSrc}
					width={176}
				/>
			) : (
				<div
					className={cn(
						'bg-secondary text-primary border-primary',
						'relative z-[1] grid place-items-center',
						'rounded-full border-8',
						'h-44 w-44 text-6xl font-bold',
					)}
				>
					{getInitials(firstName, lastName)}
				</div>
			)}

			<div className="-mt-36 ml-8 flex h-full flex-col justify-between gap-4 rounded-xl bg-white text-black">
				<header className="pl-40 pr-12 pt-6">
					<h3 className="font-serif text-3xl">
						{firstName} {lastName}
					</h3>
					<p className="mb-2 text-lg">{role}</p>
					<div className="flex gap-6">
						<ContactButton email={email} />
						<ContactButton phone={phone} />
					</div>
				</header>

				<p className="px-12 pb-12 text-xl">{vision}</p>
			</div>
		</article>
	);
}

interface ContactPersonsProps {
	contactPersons: ComponentProps<typeof ContactPersonItem>[];
}

export default function ContactPersons({ contactPersons }: ContactPersonsProps) {
	const cpLength = contactPersons.length;

	return (
		<div
			className={cn(
				'grid items-stretch gap-x-8 gap-y-20',
				{ 'grid-cols-3': cpLength % 3 === 0 },
				{ 'grid-cols-2': cpLength % 3 !== 0 && cpLength % 2 === 0 },
				{ 'grid-cols-1': cpLength % 3 !== 0 && cpLength % 2 !== 0 && cpLength % 1 === 0 },
			)}
		>
			{contactPersons.map(props => (
				<ContactPersonItem key={props.lastName} {...props} />
			))}
		</div>
	);
}
