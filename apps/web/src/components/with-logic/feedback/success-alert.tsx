import { Check } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SuccessAlertProps {
	identifier?: string;
}

export function SuccessAlert({ identifier }: Readonly<SuccessAlertProps>) {
	return (
		<Alert variant="success">
			<div>
				<Check className="size-6" />
				<AlertTitle>Vielen Dank!</AlertTitle>
			</div>
			<AlertDescription className="mt-2">
				Dein Feedback wurde erfolgreich übermittelt.
				{identifier && (
					<span className="mt-2 block text-base md:text-lg">
						Deine Ticketnummer für Nachfragen lautet: {identifier}.
					</span>
				)}
			</AlertDescription>
		</Alert>
	);
}
