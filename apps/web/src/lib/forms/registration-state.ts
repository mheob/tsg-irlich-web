type RegistrationState = 'closed' | 'open' | 'upcoming' | 'waitlist';

interface RegistrationStateInput {
	capacity?: number | null;
	now: Date;
	registeredCount: number;
	registrationEnd?: string | null;
	registrationStart?: string | null;
}

/**
 * Where a registration stands: not started yet, over, full (new entries join the waitlist) or open.
 *
 * @param input - The form's window and capacity, the current time and the registered count.
 * @param input.capacity - The limit after which entries join the waitlist, if any.
 * @param input.now - The current time.
 * @param input.registeredCount - How many submissions are registered.
 * @param input.registrationEnd - The ISO instant the registration ends, if any.
 * @param input.registrationStart - The ISO instant the registration begins, if any.
 * @returns The state, checked in the order upcoming, closed, waitlist, open.
 */
function getRegistrationState({
	capacity,
	now,
	registeredCount,
	registrationEnd,
	registrationStart,
}: RegistrationStateInput): RegistrationState {
	if (registrationStart && now < new Date(registrationStart)) {
		return 'upcoming';
	}
	if (registrationEnd && now >= new Date(registrationEnd)) {
		return 'closed';
	}
	if (capacity && registeredCount >= capacity) {
		return 'waitlist';
	}
	return 'open';
}

/**
 * The places left before the waitlist starts.
 *
 * @param capacity - The limit, if any.
 * @param registeredCount - How many submissions are registered.
 * @returns The free places, never below 0, or `null` without a limit.
 */
function getRemainingPlaces(
	capacity: number | null | undefined,
	registeredCount: number,
): number | null {
	return capacity ? Math.max(0, capacity - registeredCount) : null;
}

export { getRegistrationState, getRemainingPlaces };
export type { RegistrationState };
