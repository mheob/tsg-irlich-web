import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { PortableText } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import type { DepartmentPageQueryResult, GroupsPage } from '@/types/sanity.types';
import { isCompleteFaq } from '@/utils/faq';

type DepartmentFaq = NonNullable<DepartmentPageQueryResult>['faqs'][number];

// The heading is optional in the studio, so a dataset without it still shows a section.
type FaqProps = Partial<NonNullable<GroupsPage['content']['faqSection']>> & {
	departmentTitle: string;
	faqs: readonly DepartmentFaq[];
};

export function Faq({
	departmentTitle,
	faqs,
	intro,
	subtitle = 'FAQ',
	title = 'Häufige Fragen',
}: Readonly<FaqProps>) {
	// The FAQPage leaves out a question without answer, so the section does too.
	const completeFaqs = faqs.filter((faq) => isCompleteFaq(faq));

	if (completeFaqs.length === 0) {
		return null;
	}

	return (
		<section className="bg-background">
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader
					title={
						<>
							{title} <span className="text-primary">{departmentTitle}</span>
						</>
					}
					subTitle={subtitle}
					isCentered
					isCenteredOnDesktop
				>
					{intro}
				</SectionHeader>

				<Accordion className="mx-auto mt-6 max-w-3xl md:mt-16">
					{completeFaqs.map((faq) => (
						<AccordionItem key={faq._id} value={faq._id}>
							<AccordionTrigger>{faq.question}</AccordionTrigger>
							<AccordionContent>
								<PortableText value={faq.answer} />
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}
