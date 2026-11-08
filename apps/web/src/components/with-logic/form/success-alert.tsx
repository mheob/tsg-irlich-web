import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SuccessAlert({ children, title = 'Vielen Dank!' }: Readonly<SuccessAlertProps>) {
	return (
		<Alert variant="success">
			<Check />
			{title && <AlertTitle>{title}</AlertTitle>}
			<AlertDescription className={title ? 'mt-2' : undefined}>
				{children ?? (
					<>
						<p className="mt-4 text-success-foreground">
							Deine Anfrage wurde erfolgreich übermittelt.
							<br />
							Wir werden uns schnellstmöglich um deine Anfrage kümmern.
						</p>
						<p className="mt-4 text-success-foreground">
							Mit freundlichen Grüßen,
							<br />
							Dein Team der TSG Irlich
						</p>
					</>
				)}
			</AlertDescription>
		</Alert>
	);
}

interface SuccessAlertProps {
	/** The confirmation; the contact form's own when left out. */
	children?: ReactNode;
	/** The heading above it; `null` leaves it out, for a confirmation that thanks the visitor itself. */
	title?: string | null;
}

export { SuccessAlert };
