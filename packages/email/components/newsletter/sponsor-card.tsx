import { Img, Link, Section, Text } from 'react-email';

import { CrHtml, CrImage, CrLoop, CrLoopItem } from '../../lib/cleverreach-tags';

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
		// Its own loop element so the editor can add, duplicate and remove sponsors.
		<CrLoop>
			<CrLoopItem name="Sponsor">
				<Section className="px-[32px] pt-[40px]">
					<Section className="rounded-[12px] border border-solid border-border bg-background-low-contrast px-[24px] py-[24px] text-center">
						<CrHtml mode="textonly">
							<Text className="m-0 font-sans text-[10px] font-bold tracking-[2px] text-muted-foreground uppercase">
								Sponsor dieser Ausgabe
							</Text>
						</CrHtml>

						{/*
							160 × 60 is the maximum box, not the rendered size: sponsor logos come in
							any aspect ratio and fixed attributes would squash them. The `width`
							attribute stays as a floor for Outlook, which ignores `max-width` and
							would otherwise render the logo at its natural size; without a `height`
							attribute it scales the height proportionally.
						*/}
						<CrImage>
							<Img
								alt={sponsor.name}
								className="mx-auto mt-[16px] h-auto max-h-[60px] w-auto max-w-[160px]"
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
			</CrLoopItem>
		</CrLoop>
	);
}
