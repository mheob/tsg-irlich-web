import { Fragment } from 'react';
import { Img, Link, Section, Text } from 'react-email';

const CLUB_ADDRESS = 'Gotenstraße 20 · 56567 Neuwied';
const CLUB_EMAIL = 'info@tsg-irlich.de';
const ONLINE_VERSION_PLACEHOLDER = '{ONLINE_VERSION}';
const UNSUBSCRIBE_PLACEHOLDER = '{UNSUBSCRIBE}';

const dividerStyle = { fontSize: '1px', height: '4px', lineHeight: '4px' };

const legalLinks: { href: string; label: string }[] = [
	{ href: '/impressum', label: 'Impressum' },
	{ href: '/datenschutz', label: 'Datenschutz' },
	{ href: '/barrierefreiheit', label: 'Barrierefreiheit' },
];

interface NewsletterFooterProps {
	baseUrl: string;
	socials: { href: string; label: string }[];
}

export function NewsletterFooter({ baseUrl, socials }: Readonly<NewsletterFooterProps>) {
	const currentYear = new Date().getFullYear();

	return (
		<>
			{/* Separates the CTA band from the footer, both of which use the primary colour. */}
			<div className="bg-secondary" style={dividerStyle}>
				&nbsp;
			</div>

			<Section className="bg-primary px-[32px] py-[32px] text-center">
				<Img
					alt="TSG Irlich"
					className="mx-auto"
					height="60"
					src={`${baseUrl}/tsg-irlich-logo.png`}
					width="80"
				/>

				<Text className="m-0 mt-[16px] font-sans text-[13px] leading-[20px] text-primary-foreground">
					TSG Irlich
					<br />
					{CLUB_ADDRESS}
					<br />
					<Link className="font-bold text-secondary" href={`mailto:${CLUB_EMAIL}`}>
						{CLUB_EMAIL}
					</Link>
				</Text>

				{socials.length > 0 && (
					<Text className="m-0 mt-[20px] font-sans text-[13px] leading-[20px] text-primary-foreground">
						{socials.map((social, index) => (
							<Fragment key={social.href}>
								{index > 0 && ' · '}
								<Link className="font-bold text-secondary" href={social.href}>
									{social.label}
								</Link>
							</Fragment>
						))}
					</Text>
				)}

				<Text className="m-0 mt-[20px] font-sans text-[12px] leading-[20px] text-primary-foreground">
					{legalLinks.map((link, index) => (
						<Fragment key={link.href}>
							{index > 0 && ' · '}
							<Link className="text-primary-foreground" href={`${baseUrl}${link.href}`}>
								{link.label}
							</Link>
						</Fragment>
					))}
				</Text>

				<Text className="m-0 mt-[16px] font-sans text-[12px] leading-[18px] text-background-high-contrast">
					©{currentYear} TSG Irlich. Alle Rechte vorbehalten.
				</Text>

				<Text className="m-0 mt-[8px] font-sans text-[12px] leading-[18px] text-background-high-contrast">
					<Link className="text-background-high-contrast" href={ONLINE_VERSION_PLACEHOLDER}>
						Im Browser ansehen
					</Link>
					{' · '}
					<Link className="text-background-high-contrast" href={UNSUBSCRIBE_PLACEHOLDER}>
						Newsletter abbestellen
					</Link>
				</Text>
			</Section>
		</>
	);
}
