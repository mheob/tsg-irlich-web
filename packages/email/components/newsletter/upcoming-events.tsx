import { Column, Hr, Row, Section, Text } from 'react-email';

import { CrHtml, CrLoop, CrLoopItem } from '../../lib/cleverreach-tags';
import { EventDateBadge } from './event-date-badge';
import type { NewsletterEvent } from './newsletter-event';
import { SectionKicker } from './section-kicker';

interface UpcomingEventsProps {
	events: NewsletterEvent[];
}

export function UpcomingEvents({ events }: Readonly<UpcomingEventsProps>) {
	if (events.length === 0) return null;

	return (
		<Section className="px-[32px] pt-[40px]">
			<SectionKicker label="Blick voraus" />

			<CrHtml>
				<Text className="m-0 mt-[16px] font-sans text-[15px] leading-[24px] text-muted-foreground">
					Was bei uns bald ansteht:
				</Text>
			</CrHtml>

			{/* Every item carries its own separator so all loop items stay identical. */}
			<CrLoop>
				{events.map((event) => (
					<CrLoopItem key={`${event.day}-${event.month}-${event.title}`} name="Termin">
						<Section>
							<Hr className="my-[16px] border-border" />

							<Row>
								<Column valign="top" width="56">
									<EventDateBadge day={event.day} month={event.month} weekday={event.weekday} />
								</Column>

								<Column className="pl-[16px]" valign="middle">
									<CrHtml>
										<Text className="m-0 font-sans text-[16px] leading-[22px] font-bold text-foreground">
											{event.title}
										</Text>
									</CrHtml>
									<CrHtml>
										<Text className="m-0 mt-[4px] font-sans text-[13px] leading-[18px] text-muted-foreground">
											{event.meta}
										</Text>
									</CrHtml>
								</Column>
							</Row>
						</Section>
					</CrLoopItem>
				))}
			</CrLoop>
		</Section>
	);
}
