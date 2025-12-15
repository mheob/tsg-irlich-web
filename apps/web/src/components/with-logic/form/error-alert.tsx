import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorAlertProps {
	error: string;
}

export function ErrorAlert({ error }: Readonly<ErrorAlertProps>) {
	return (
		<Alert variant="destructive">
			<AlertTitle>Fehler</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	);
}
