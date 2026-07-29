import { Img, Section, Text } from 'react-email';

import { CrHtml } from '../../lib/cleverreach-tags';

interface NewsletterHeaderProps {
	baseUrl: string;
	issueLabel: string;
}

export function NewsletterHeader({ baseUrl, issueLabel }: Readonly<NewsletterHeaderProps>) {
	return (
		<Section className="bg-primary px-[32px] py-[32px] text-center">
			<Img
				alt="TSG Irlich"
				className="mx-auto"
				height="120"
				src={`${baseUrl}/tsg-irlich-logo.png`}
				width="160"
			/>

			{/* The logo stays fixed, only the issue line is editable. */}
			<CrHtml mode="textonly">
				<Text className="m-0 mt-[20px] font-sans text-[11px] font-bold tracking-[2px] text-secondary uppercase">
					{issueLabel}
				</Text>
			</CrHtml>
		</Section>
	);
}
