import { Heading, Section, Text } from 'react-email';

import { CrHtml } from '../../lib/cleverreach-tags';
import { EmailButton } from './email-button';

interface CtaBandProps {
	cta: {
		buttonLabel: string;
		href: string;
		text: string;
		title: string;
	};
}

export function CtaBand({ cta }: Readonly<CtaBandProps>) {
	return (
		<Section className="mt-[40px] bg-primary px-[32px] py-[40px] text-center">
			<CrHtml>
				<Heading
					as="h2"
					className="font-heading m-0 text-[26px] leading-[30px] tracking-[0.5px] text-primary-foreground uppercase"
				>
					{cta.title}
				</Heading>
			</CrHtml>

			<CrHtml>
				<Text className="m-0 mt-[12px] font-sans text-[15px] leading-[24px] text-background-high-contrast">
					{cta.text}
				</Text>
			</CrHtml>

			<Section className="mt-[24px]">
				<EmailButton href={cta.href} isCentered isEditable label={cta.buttonLabel} />
			</Section>
		</Section>
	);
}
