/**
 * A failure the render pipeline explains itself, in German. Its message reaches `render.error`
 * unchanged; every other error is prefixed so editors still read where it happened.
 */
class RenderError extends Error {
	public override name = 'RenderError';
}

export { RenderError };
