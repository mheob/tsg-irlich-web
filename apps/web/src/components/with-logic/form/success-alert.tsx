import { CheckCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SuccessAlert() {
	return (
		<Alert variant="success">
			<CheckCircle className="size-6" />
			<AlertTitle>Vielen Dank!</AlertTitle>
			<AlertDescription className="mt-2">
				<p className="text-success-foreground mt-4">
					Dein Anfrage wurde erfolgreich übermittelt.
					<br />
					Wir werden uns schnellstmöglich um deine Anfrage kümmern.
				</p>
				<p className="text-success-foreground mt-4">
					Mit freundlichen Grüßen,
					<br />
					Dein Team der TSG Irlich
				</p>
			</AlertDescription>
		</Alert>
	);
}
