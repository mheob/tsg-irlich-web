import { Img, Link, Section, Text } from 'react-email';

import { CrHtml, CrImage } from '../../lib/cleverreach-tags';

interface SponsorCardProps {
	sponsor: {
		href: string;
		logoUrl: string;
		name: string;
		text: string;
	};
}

export function SponsorCard({ sponsor }: Readonly<SponsorCardProps>) {
	return (
		<Section className="px-[32px] pt-[40px]">
			<Section className="rounded-[12px] border border-solid border-border bg-background-low-contrast px-[24px] py-[24px] text-center">
				<CrHtml mode="textonly">
					<Text className="m-0 font-sans text-[10px] font-bold tracking-[2px] text-muted-foreground uppercase">
						Sponsor dieser Ausgabe
					</Text>
				</CrHtml>

				<CrImage>
					<Img
						alt={sponsor.name}
						className="mx-auto mt-[16px]"
						height="60"
						src={sponsor.logoUrl}
						width="160"
					/>
				</CrImage>

				<CrHtml>
					<Text className="m-0 mt-[16px] font-sans text-[14px] leading-[21px] text-muted-foreground">
						{sponsor.text}
					</Text>
				</CrHtml>

				<CrHtml>
					<Link
						className="mt-[12px] inline-block font-sans text-[14px] font-bold text-primary"
						href={sponsor.href}
					>
						{sponsor.name} kennenlernen →
					</Link>
				</CrHtml>
			</Section>
		</Section>
	);
}
