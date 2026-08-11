import { Column, Row, Section, Text } from 'react-email';

import { CrHtml, CrLoop, CrLoopItem } from '../../lib/cleverreach-tags';
import { NewsCard } from './news-card';
import { SectionKicker } from './section-kicker';

/** Container width (600px) minus the section padding (2 × 32px) minus the gutter (24px), halved. */
const CARD_WIDTH = 256;
/** 16:9 of `CARD_WIDTH`. */
const CARD_IMAGE_HEIGHT = 144;
const COLUMNS_PER_ROW = 2;
const GUTTER_WIDTH = 24;

interface NewsGridProps {
	news: {
		category: string;
		href: string;
		imageUrl: string;
		teaser: string;
		title: string;
	}[];
}

function toRows<T>(items: T[]): T[][] {
	const rows: T[][] = [];
	for (let index = 0; index < items.length; index += COLUMNS_PER_ROW) {
		rows.push(items.slice(index, index + COLUMNS_PER_ROW));
	}
	return rows;
}

export function NewsGrid({ news }: Readonly<NewsGridProps>) {
	if (news.length === 0) return null;

	return (
		<Section className="px-[32px] pt-[40px]">
			<SectionKicker label="Aus dem Verein" />

			<CrHtml>
				<Text className="m-0 mt-[16px] font-sans text-[15px] leading-[24px] text-muted-foreground">
					Die letzten Neuigkeiten aus unseren Abteilungen:
				</Text>
			</CrHtml>

			{/*
				One loop item is a whole row of two cards: CleverReach forbids loops between
				`<table>` and `<tr>`, and every row is its own table.
			*/}
			<CrLoop>
				{toRows(news).map((row) => (
					<CrLoopItem key={row.map((article) => article.href).join('|')} name="News-Zeile">
						<Row className="mt-[24px]">
							<Column className="stack" valign="top" width={CARD_WIDTH}>
								<NewsCard
									article={row[0]}
									imageHeight={CARD_IMAGE_HEIGHT}
									imageWidth={CARD_WIDTH}
								/>
							</Column>

							<Column className="gutter" width={GUTTER_WIDTH}>
								&nbsp;
							</Column>

							<Column className="stack stack-gap" valign="top" width={CARD_WIDTH}>
								{row[1] ? (
									<NewsCard
										article={row[1]}
										imageHeight={CARD_IMAGE_HEIGHT}
										imageWidth={CARD_WIDTH}
									/>
								) : (
									<span>&nbsp;</span>
								)}
							</Column>
						</Row>
					</CrLoopItem>
				))}
			</CrLoop>
		</Section>
	);
}
