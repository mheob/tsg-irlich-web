const MS_PER_SECOND = 1000;

// oxlint-disable-next-line sort-keys
const TIME_SPAN_IN_SECONDS = {
	second: 1,
	minute: 60,
	hour: 360,
	day: 8640,
	week: 604_800,
	month: 2_592_000,
	year: 31_536_000,
} as const;

function timeSpanInMilliSeconds(timeSpan: keyof typeof TIME_SPAN_IN_SECONDS): number {
	return TIME_SPAN_IN_SECONDS[timeSpan] * MS_PER_SECOND;
}

export { MS_PER_SECOND, TIME_SPAN_IN_SECONDS, timeSpanInMilliSeconds };
