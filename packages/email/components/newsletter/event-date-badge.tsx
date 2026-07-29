import { CrHtml } from '../../lib/cleverreach-tags';

interface EventDateBadgeProps {
	day: string;
	month: string;
}

// Yellow date tile in front of an event, 56 × 56 as a table so Outlook keeps its size.
export function EventDateBadge({ day, month }: Readonly<EventDateBadgeProps>) {
	return (
		<table cellPadding={0} cellSpacing={0} role="presentation" width="56">
			<tbody>
				<tr>
					<td
						align="center"
						className="rounded-[8px] bg-secondary py-[8px]"
						height="56"
						valign="middle"
						width="56"
					>
						<div className="font-sans text-[20px] leading-[22px] font-bold text-secondary-foreground">
							<CrHtml mode="textonly">{day}</CrHtml>
						</div>
						<div className="font-sans text-[10px] leading-[14px] font-bold tracking-[1px] text-secondary-foreground uppercase">
							<CrHtml mode="textonly">{month}</CrHtml>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
