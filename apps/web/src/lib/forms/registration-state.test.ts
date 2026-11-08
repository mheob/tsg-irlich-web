import { describe, expect, it } from 'vite-plus/test';

import { getRegistrationState, getRemainingPlaces } from './registration-state';

const NOW = new Date('2027-04-01T10:00:00Z');

describe('registration state', () => {
	it('is upcoming before the start', () => {
		expect(
			getRegistrationState({
				now: NOW,
				registeredCount: 0,
				registrationStart: '2027-04-02T00:00:00Z',
			}),
		).toBe('upcoming');
	});

	it('is open inside the window', () => {
		expect(
			getRegistrationState({
				capacity: 10,
				now: NOW,
				registeredCount: 3,
				registrationEnd: '2027-04-30T21:59:59Z',
				registrationStart: '2027-03-01T00:00:00Z',
			}),
		).toBe('open');
	});

	it('is closed after the end', () => {
		expect(
			getRegistrationState({
				now: NOW,
				registeredCount: 0,
				registrationEnd: '2027-03-31T00:00:00Z',
			}),
		).toBe('closed');
	});

	it('is waitlist once the capacity is reached', () => {
		expect(getRegistrationState({ capacity: 10, now: NOW, registeredCount: 10 })).toBe('waitlist');
	});

	it('prefers closed over waitlist', () => {
		expect(
			getRegistrationState({
				capacity: 1,
				now: NOW,
				registeredCount: 5,
				registrationEnd: '2027-03-31T00:00:00Z',
			}),
		).toBe('closed');
	});

	it('stays open until the end instant', () => {
		const registrationEnd = '2027-04-30T21:59:59Z';

		expect(
			getRegistrationState({
				now: new Date('2027-04-30T21:59:58Z'),
				registeredCount: 0,
				registrationEnd,
			}),
		).toBe('open');
		expect(
			getRegistrationState({ now: new Date(registrationEnd), registeredCount: 0, registrationEnd }),
		).toBe('closed');
	});

	it('is open without start and end', () => {
		expect(getRegistrationState({ now: NOW, registeredCount: 99 })).toBe('open');
	});

	it('reports the remaining places', () => {
		expect(getRemainingPlaces(undefined, 4)).toBeNull();
		expect(getRemainingPlaces(null, 4)).toBeNull();
		expect(getRemainingPlaces(10, 4)).toBe(6);
		expect(getRemainingPlaces(10, 12)).toBe(0);
	});
});
