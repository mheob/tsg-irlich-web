import { describe, expect, it } from 'vitest';

import { EMPTY_ARRAY, EMPTY_FUNCTION, EMPTY_OBJECT } from './jsx';

describe('empty jsx placeholders', () => {
	it('exposes an empty array', () => {
		expect(EMPTY_ARRAY).toStrictEqual([]);
	});

	it('exposes an empty object', () => {
		expect(EMPTY_OBJECT).toStrictEqual({});
	});

	it('exposes a callable no-op', () => {
		expect(() => {
			EMPTY_FUNCTION();
		}).not.toThrow();
	});

	it('hands out the same references on every read', () => {
		// The point of these constants: a stable identity per render, so passing one as a prop
		// or a hook dependency does not retrigger work. A fresh literal per access would defeat
		// that without failing any of the shape assertions above.
		expect(EMPTY_ARRAY).toBe(EMPTY_ARRAY);
		expect(EMPTY_OBJECT).toBe(EMPTY_OBJECT);
		expect(EMPTY_FUNCTION).toBe(EMPTY_FUNCTION);
	});
});
