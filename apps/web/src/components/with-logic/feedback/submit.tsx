import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SubmitProps {
	isSubmitting: boolean;
}

export function Submit({ isSubmitting }: Readonly<SubmitProps>) {
	return (
		<Button className="mt-5 md:mt-10" disabled={isSubmitting} type="submit" fullWidth>
			{isSubmitting ? (
				<>
					<Loader2 className="mr-2 inline size-6 animate-spin" />
					Wird gesendet...
				</>
			) : (
				'Feedback senden'
			)}
		</Button>
	);
}
