import slugifyFn from 'slugify';

const unneededWords = new Set([
	'aber',
	'an',
	'auf',
	'das',
	'der',
	'die',
	'ein',
	'eine',
	'einem',
	'einen',
	'einer',
	'eines',
	'im',
	'in',
	'oder',
	'sowie',
	'und',
	'von',
	'weil',
	'zu',
]);

export function slugify(input: string): string {
	return slugifyFn(input, {
		locale: 'de',
		lower: true,
		remove: /[^a-zA-Z0-9\s]/g,
		trim: true,
	})
		.split('-')
		.filter(word => !unneededWords.has(word))
		.join('-');
}
