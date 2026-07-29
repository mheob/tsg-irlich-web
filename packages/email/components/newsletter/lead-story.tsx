import { Heading, Img, Section, Text } from 'react-email';

import { CrHtml, CrImage } from '../../lib/cleverreach-tags';
import { EmailButton } from './email-button';
import { SectionKicker } from './section-kicker';

interface LeadStoryProps {
	leadStory: {
		href: string;
		imageUrl: string;
		kicker: string;
		teaser: string;
		title: string;
	};
}

export function LeadStory({ leadStory }: Readonly<LeadStoryProps>) {
	return (
		<>
			<CrImage>
				<Img
					alt={leadStory.title}
					className="w-full"
					height="315"
					src={leadStory.imageUrl}
					width="600"
				/>
			</CrImage>

			<Section className="px-[32px] pt-[32px]">
				<SectionKicker label={leadStory.kicker} />

				<CrHtml>
					<Heading
						as="h1"
						className="font-heading m-0 mt-[16px] text-[32px] leading-[36px] tracking-[0.5px] text-foreground uppercase"
					>
						{leadStory.title}
					</Heading>
				</CrHtml>

				<CrHtml>
					<Text className="m-0 mt-[16px] font-sans text-[15px] leading-[24px] text-muted-foreground">
						{leadStory.teaser}
					</Text>
				</CrHtml>

				<Section className="mt-[24px]">
					<EmailButton href={leadStory.href} isEditable label="Ganze Story lesen" />
				</Section>
			</Section>
		</>
	);
}
