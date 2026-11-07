import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useIsHydrated } from '@/hooks/use-is-hydrated';

interface SubmitProps {
	isSubmitting: boolean;
}

export function Submit({ isSubmitting }: Readonly<SubmitProps>) {
	// Disabled until hydration: a form sent before then would skip the validation and the action.
	const isHydrated = useIsHydrated();

	return (
		<Button
			className="mt-5 md:mt-10"
			disabled={isSubmitting || !isHydrated}
			type="submit"
			fullWidth
		>
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
