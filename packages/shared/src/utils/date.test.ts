import { describe, expect, it } from 'vitest';

import { MS_PER_SECOND, TIME_SPAN_IN_SECONDS, timeSpanInMilliSeconds } from './date';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

describe('time span constants', () => {
	it('holds one second', () => {
		expect(TIME_SPAN_IN_SECONDS.second).toBe(1);
	});

	it('holds a minute in seconds', () => {
		expect(TIME_SPAN_IN_SECONDS.minute).toBe(SECONDS_PER_MINUTE);
	});

	it('holds an hour in seconds', () => {
		expect(TIME_SPAN_IN_SECONDS.hour).toBe(SECONDS_PER_MINUTE * MINUTES_PER_HOUR);
	});

	it('holds a day in seconds', () => {
		expect(TIME_SPAN_IN_SECONDS.day).toBe(SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY);
	});

	it('holds a week as seven days', () => {
		expect(TIME_SPAN_IN_SECONDS.week).toBe(TIME_SPAN_IN_SECONDS.day * DAYS_PER_WEEK);
	});

	it('holds a month as thirty days', () => {
		expect(TIME_SPAN_IN_SECONDS.month).toBe(TIME_SPAN_IN_SECONDS.day * DAYS_PER_MONTH);
	});

	it('holds a year as 365 days', () => {
		expect(TIME_SPAN_IN_SECONDS.year).toBe(TIME_SPAN_IN_SECONDS.day * DAYS_PER_YEAR);
	});
});

describe('time span conversion', () => {
	it('converts a span to milliseconds', () => {
		expect(timeSpanInMilliSeconds('minute')).toBe(60_000);
	});

	it('converts the smallest span', () => {
		expect(timeSpanInMilliSeconds('second')).toBe(1000);
	});

	it('exports one second in milliseconds', () => {
		expect(MS_PER_SECOND).toBe(1000);
	});
});
